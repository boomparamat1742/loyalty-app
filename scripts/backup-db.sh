#!/usr/bin/env bash
# Backup the Supabase database (schema + data + auth users) and reward images
# into backups/<timestamp>/. Run from the project root with Git Bash:
#   bash scripts/backup-db.sh
# Reads DB_URL (Session pooler connection string) from .env.backup.
# Uses psql only, because pg_dump is blocked by Windows Smart App Control on this machine.
set -euo pipefail

PSQL="${PSQL:-/c/Program Files/PostgreSQL/17/bin/psql.exe}"
DB_URL=$(grep -E '^DB_URL=' .env.backup | cut -d= -f2- | tr -d '\r ')
[ -n "$DB_URL" ] || { echo "DB_URL is empty in .env.backup"; exit 1; }

OUT="backups/$(date +%Y-%m-%d_%H%M)"
mkdir -p "$OUT/data" "$OUT/images"
q() { "$PSQL" "$DB_URL" -X -A -t -q -v ON_ERROR_STOP=1 "$@" | tr -d '\r'; }

# ---------- schema: tables (without FKs) + functions + views ----------
q -c "set search_path = pg_catalog;
select 'set check_function_bodies = off;';
select format(E'create table public.%I (\n  %s\n);', c.relname,
  (select string_agg(format('%I %s%s%s', a.attname, format_type(a.atttypid,a.atttypmod),
      coalesce(' default '||pg_get_expr(d.adbin,d.adrelid),''), case when a.attnotnull then ' not null' else '' end), E',\n  ' order by a.attnum)
     from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
     where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped)
  || coalesce((select string_agg(format(E',\n  constraint %I %s', co.conname, pg_get_constraintdef(co.oid)), '' order by co.contype desc, co.conname)
     from pg_constraint co where co.conrelid=c.oid and co.contype in ('p','u','c')),''))
from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r' order by c.relname;
-- function bodies are hex-encoded so line endings survive byte-for-byte
select format('do \$x\$ begin execute convert_from(decode(%L, ''hex''), ''UTF8''); end \$x\$; -- %s',
  encode(convert_to(pg_get_functiondef(p.oid),'UTF8'),'hex'), p.oid::regprocedure)
from pg_proc p where p.pronamespace='public'::regnamespace order by p.proname;
select format('create view public.%I%s as %s', c.relname,
  coalesce(' with ('||array_to_string(c.reloptions, ', ')||')',''), pg_get_viewdef(c.oid))
from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='v' order by c.relname;" > "$OUT/schema_pre.sql"

# ---------- schema: FKs, indexes, RLS, policies, triggers, grants, buckets ----------
q -c "set search_path = pg_catalog;
select format('alter table %s add constraint %I %s;', co.conrelid::regclass, co.conname, pg_get_constraintdef(co.oid))
from pg_constraint co where co.connamespace='public'::regnamespace and co.contype='f';
select pg_get_indexdef(i.indexrelid)||';' from pg_index i join pg_class c on c.oid=i.indrelid
where c.relnamespace='public'::regnamespace and not exists (select 1 from pg_constraint where conindid=i.indexrelid);
select format('alter table %s enable row level security;', c.oid::regclass) from pg_class c where c.relnamespace='public'::regnamespace and c.relrowsecurity;
select format('alter table %s force row level security;', c.oid::regclass) from pg_class c where c.relnamespace='public'::regnamespace and c.relforcerowsecurity;
select format('create policy %I on %s as %s for %s to %s%s%s;', pol.polname, pol.polrelid::regclass,
  case when pol.polpermissive then 'permissive' else 'restrictive' end,
  case pol.polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update' when 'd' then 'delete' else 'all' end,
  case when pol.polroles = '{0}' then 'public' else (select string_agg(quote_ident(rolname), ', ') from pg_roles where oid = any(pol.polroles)) end,
  coalesce(' using ('||pg_get_expr(pol.polqual, pol.polrelid)||')',''),
  coalesce(' with check ('||pg_get_expr(pol.polwithcheck, pol.polrelid)||')',''))
from pg_policy pol join pg_class c on c.oid=pol.polrelid where c.relnamespace in ('public'::regnamespace,'storage'::regnamespace);
select pg_get_triggerdef(t.oid)||';' from pg_trigger t join pg_class c on c.oid=t.tgrelid
where not t.tgisinternal and (c.relnamespace='public'::regnamespace or t.tgrelid='auth.users'::regclass);
select format('revoke all on function %s from public, anon, authenticated, service_role;', p.oid::regprocedure)
  || coalesce((select string_agg(format(' grant %s on function %s to %s;', x.privilege_type, p.oid::regprocedure,
        case when x.grantee=0 then 'public' else quote_ident(pg_get_userbyid(x.grantee)) end), '')
     from aclexplode(p.proacl) x where x.grantee <> p.proowner),'')
from pg_proc p where p.pronamespace='public'::regnamespace and p.proacl is not null;
select format('insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (%L, %L, %L, %s, %L) on conflict (id) do nothing;',
  id, name, public, coalesce(file_size_limit::text,'null'), allowed_mime_types) from storage.buckets;" > "$OUT/schema_post.sql"

# ---------- data: auth users first, then every public table ----------
: > "$OUT/load.sql"
tables="auth.users auth.identities $(q -c "select string_agg('public.'||quote_ident(relname), ' ' order by relname) from pg_class where relnamespace='public'::regnamespace and relkind='r'")"
for t in $tables; do
  cols=$(q -c "select string_agg(quote_ident(attname), ',' order by attnum) from pg_attribute where attrelid='$t'::regclass and attnum>0 and not attisdropped and attgenerated=''")
  "$PSQL" "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c "\copy (select $cols from $t) to '$OUT/data/$t.csv' with (format csv)"
  echo "\\copy $t ($cols) from 'data/$t.csv' with (format csv)" >> "$OUT/load.sql"
  echo "  $t: $(q -c "select count(*) from $t") rows"
done

# ---------- images (public bucket, no key needed) ----------
BASE="https://$(echo "$DB_URL" | sed -E 's#^postgresql://postgres\.([a-z0-9]+):.*#\1#').supabase.co/storage/v1/object/public"
n=0
while IFS='|' read -r bucket name; do
  [[ "$name" == *.emptyFolderPlaceholder ]] && continue
  mkdir -p "$OUT/images/$bucket/$(dirname "$name")"
  curl -sf -o "$OUT/images/$bucket/$name" "$BASE/$bucket/$name" && n=$((n+1)) || echo "  image failed: $bucket/$name"
done < <(q -c "select bucket_id, name from storage.objects")
echo "  images: $n files"

cat > "$OUT/README.txt" <<'EOF'
Restore into an EMPTY Supabase project (run inside this folder with Git Bash):

  psql "<NEW_DB_URL>" -X --single-transaction -v ON_ERROR_STOP=1 \
       -f schema_pre.sql -f load.sql -f schema_post.sql

Then upload the files in images/<bucket>/ to the same paths in Storage,
and update image URLs in public.rewards if the project URL changed.
Auth settings (Site URL, Confirm email, SMTP) are not included - set them in the dashboard.
EOF

echo "Backup saved to $OUT"
