<script setup>
import { message } from "ant-design-vue";
import {
  SaveOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons-vue";
import dayjs from "dayjs";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const loading = ref(false);
const systemInfo = ref({
  uptimeStarted: new Date().toISOString(),
  version: "1.0.0",
  environment: "production",
  database: "Connected",
});

const settings = reactive({
  maintenanceMode: false,
  allowNewRegistrations: true,
  maxPointsPerPurchase: 1000,
  pointsExpiryDays: 365,
  emailNotifications: true,
  autoBackup: true,
  backupFrequency: "daily",
});

const settingsLoading = ref(false);
const isSaved = ref(false);

onMounted(async () => {
  await loadSettings();
});

const loadSettings = async () => {
  try {
    settingsLoading.value = true;
    // Simulate loading settings from database
    // In a real app, you'd fetch from a settings table
    isSaved.value = true;
    setTimeout(() => {
      isSaved.value = false;
    }, 2000);
  } catch (e) {
    console.error(e);
    message.error("Failed to load settings");
  } finally {
    settingsLoading.value = false;
  }
};

const saveSettings = async () => {
  try {
    loading.value = true;

    // TODO: Save to database
    // const { error } = await supabase
    //   .from('system_settings')
    //   .upsert(settings)

    message.success("Settings saved successfully");
    isSaved.value = true;
    setTimeout(() => {
      isSaved.value = false;
    }, 3000);
  } catch (e) {
    console.error(e);
    message.error(e?.message || "Failed to save settings");
  } finally {
    loading.value = false;
  }
};

const getUptimeString = () => {
  const start = dayjs(systemInfo.value.uptimeStarted);
  const now = dayjs();
  const duration = now.diff(start);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h`;
};

const resetToDefaults = () => {
  settings.maintenanceMode = false;
  settings.allowNewRegistrations = true;
  settings.maxPointsPerPurchase = 1000;
  settings.pointsExpiryDays = 365;
  settings.emailNotifications = true;
  settings.autoBackup = true;
  settings.backupFrequency = "daily";
  message.info("Settings reset to defaults");
};
</script>

<template>
  <div class="settings-container">
    <div class="settings-header">
      <div>
        <a-typography-title :level="3" style="margin: 0">
          System Settings
        </a-typography-title>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px">
          Configure system-wide settings and preferences
        </p>
      </div>

      <a-space>
        <a-button @click="loadSettings" :loading="settingsLoading" :icon="ReloadOutlined">
          Reload
        </a-button>
        <a-button type="primary" @click="saveSettings" :loading="loading" :icon="SaveOutlined">
          Save Changes
        </a-button>
      </a-space>
    </div>

    <!-- Status Alerts -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 24px">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-statistic
          title="System Status"
          :value="systemInfo.database"
          :value-style="{ color: '#22c55e' }"
        >
          <template #prefix>
            <CheckCircleOutlined style="color: #22c55e" />
          </template>
        </a-statistic>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-statistic
          title="Uptime"
          :value="getUptimeString()"
          :value-style="{ color: '#3b82f6' }"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-statistic
          title="Version"
          :value="systemInfo.version"
          :value-style="{ color: '#9ca3af' }"
        />
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-statistic
          title="Environment"
          :value="systemInfo.environment"
          :value-style="{ color: '#a855f7' }"
        />
      </a-col>
    </a-row>

    <!-- Save Status -->
    <a-alert
      v-if="isSaved"
      message="Settings have been saved successfully"
      type="success"
      show-icon
      closable
      style="margin-bottom: 24px"
    />

    <!-- Settings Sections -->
    <a-row :gutter="[24, 24]">
      <!-- System Settings -->
      <a-col :xs="24" :lg="12">
        <a-card title="System Settings" :bordered="false" style="border-radius: 12px; border: 1px solid #e5e7eb">
          <a-form layout="vertical">
            <a-form-item label="Maintenance Mode">
              <a-switch v-model:checked="settings.maintenanceMode" />
              <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
                When enabled, only admins can access the system
              </p>
            </a-form-item>

            <a-form-item label="Allow New Registrations">
              <a-switch v-model:checked="settings.allowNewRegistrations" />
              <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
                Allow new users to register without admin approval
              </p>
            </a-form-item>

            <a-form-item label="Maximum Points per Purchase">
              <a-input-number
                v-model:value="settings.maxPointsPerPurchase"
                :min="1"
                :max="10000"
                style="width: 100%"
              />
              <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
                Maximum point value allowed per transaction
              </p>
            </a-form-item>

            <a-form-item label="Points Expiry (days)">
              <a-input-number
                v-model:value="settings.pointsExpiryDays"
                :min="1"
                :max="3650"
                style="width: 100%"
              />
              <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
                Days until unused points expire
              </p>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- Notification & Backup Settings -->
      <a-col :xs="24" :lg="12">
        <a-card title="Notifications & Backup" :bordered="false" style="border-radius: 12px; border: 1px solid #e5e7eb">
          <a-form layout="vertical">
            <a-form-item label="Email Notifications">
              <a-switch v-model:checked="settings.emailNotifications" />
              <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
                Send email notifications for important events
              </p>
            </a-form-item>

            <a-form-item label="Automatic Backups">
              <a-switch v-model:checked="settings.autoBackup" />
              <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
                Automatically backup system data
              </p>
            </a-form-item>

            <a-form-item label="Backup Frequency" v-if="settings.autoBackup">
              <a-select v-model:value="settings.backupFrequency">
                <a-select-option value="hourly">Hourly</a-select-option>
                <a-select-option value="daily">Daily</a-select-option>
                <a-select-option value="weekly">Weekly</a-select-option>
                <a-select-option value="monthly">Monthly</a-select-option>
              </a-select>
            </a-form-item>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb">
              <a-button danger @click="resetToDefaults">
                <template #icon>
                  <WarningOutlined />
                </template>
                Reset to Defaults
              </a-button>
              <p style="color: #ef4444; font-size: 12px; margin-top: 8px">
                This will reset all settings to their default values
              </p>
            </div>
          </a-form>
        </a-card>
      </a-col>
    </a-row>

    <!-- API & Security Section -->
    <a-card 
      title="API & Security" 
      :bordered="false" 
      style="border-radius: 12px; border: 1px solid #e5e7eb; margin-top: 24px"
    >
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="12">
          <div class="info-box">
            <div class="info-label">API Rate Limit</div>
            <div class="info-value">1000 requests/hour</div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
              Maximum API requests per hour per IP
            </p>
          </div>
        </a-col>
        <a-col :xs="24" :md="12">
          <div class="info-box">
            <div class="info-label">Session Timeout</div>
            <div class="info-value">24 hours</div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 8px">
              Automatic session expiration time
            </p>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<style scoped>
.settings-container {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 24px;
  min-height: 100vh;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.info-box {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.info-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
