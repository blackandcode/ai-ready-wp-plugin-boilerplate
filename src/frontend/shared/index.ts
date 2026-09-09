/**
 * Shared Modules and Components Export.
 *
 * @package
 */

// API Clients & Transports
export {
	SettingsApiClient,
	defaultSettingsApiClient,
	ApiClientError,
	type ISettingsApiClient,
	type FetcherFn,
	type FetcherOptions,
} from './api/SettingsApiClient';

// UI Components
export { CardLayout } from './components/CardLayout';
export { SectionHeader } from './components/SectionHeader';
export {
	NoticeBanner,
	type NoticeBannerProps,
} from './components/NoticeBanner';
export {
	LoadingSkeleton,
	type LoadingSkeletonProps,
} from './components/LoadingSkeleton';
export { ErrorBoundary } from './components/ErrorBoundary';

// Custom Hooks
export {
	useSettingsForm,
	type SettingsFormState,
} from './hooks/useSettingsForm';
export {
	useNotice,
	type NoticeStatus,
	type NoticeState,
} from './hooks/useNotice';
export { useSettingsApi } from './hooks/useSettingsApi';

// Types
export type {
	GeneralSettings,
	AdvancedSettings,
	DataRetentionSettings,
	PluginSettingsData,
	PluginSettings,
	SystemDiagnosticsData,
	AirwpBootstrapData,
} from './types';
