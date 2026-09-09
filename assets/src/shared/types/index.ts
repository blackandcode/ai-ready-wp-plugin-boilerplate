/**
 * Shared Plugin Types and Contracts.
 *
 * @package
 */

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

export interface PluginSettingsData {
	general: GeneralSettings;
	advanced: AdvancedSettings;
	data_retention: DataRetentionSettings;
}

export type PluginSettings = PluginSettingsData;

export interface SystemDiagnosticsData {
	php_version: string;
	wp_version: string;
	environment_type: string;
	db_status: string;
	rest_status: string;
	plugin_version: string;
}

export interface AirwpBootstrapData {
	apiBase: string;
	nonce: string;
	version: string;
	currentUserCan: {
		manageOptions: boolean;
	};
	initialSettings?: PluginSettingsData;
	environment?: {
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
