export interface GeneralSettings {
  greeting_message: string;
  enable_feature: boolean;
  description: string;
}

export interface AdvancedSettings {
  rest_debug: boolean;
  cache_ttl: number;
}

export interface DataRetentionSettings {
  uninstall_action: 'preserve' | 'delete_settings' | 'delete_all';
}

export interface PluginSettings {
  general: GeneralSettings;
  advanced: AdvancedSettings;
  data_retention: DataRetentionSettings;
}

export interface AirwpBootstrapData {
  apiBase: string;
  nonce: string;
  version: string;
  currentUserCan: {
    manageOptions: boolean;
  };
  initialSettings: PluginSettings;
  environment: {
    phpVersion: string;
    wpVersion: string;
    environmentType: string;
  };
}

declare global {
  interface Window {
    airwpAdminBootstrap?: AirwpBootstrapData;
  }
}
