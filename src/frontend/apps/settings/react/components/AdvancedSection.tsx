import {
	ToggleControl,
	RangeControl,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { AdvancedSettings, DataRetentionSettings } from '../../../shared';

interface AdvancedSectionProps {
	advanced: AdvancedSettings;
	dataRetention: DataRetentionSettings;
	onAdvancedChange: ( updated: AdvancedSettings ) => void;
	onDataRetentionChange: ( updated: DataRetentionSettings ) => void;
}

export function AdvancedSection( {
	advanced,
	dataRetention,
	onAdvancedChange,
	onDataRetentionChange,
}: AdvancedSectionProps ) {
	return (
		<>
			<ToggleControl
				__nextHasNoMarginBottom={ true }
				label={ __(
					'REST API Debug Headers',
					'wp-ai-ready-plugin-boilerplate'
				) }
				checked={ advanced.rest_debug }
				onChange={ ( checked: boolean ) =>
					onAdvancedChange( { ...advanced, rest_debug: checked } )
				}
				help={ __(
					'Append debug headers (execution time, memory peak) to REST API responses.',
					'wp-ai-ready-plugin-boilerplate'
				) }
			/>

			<RangeControl
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
				label={ __(
					'Cache Time-to-Live (Seconds)',
					'wp-ai-ready-plugin-boilerplate'
				) }
				value={ advanced.cache_ttl }
				onChange={ ( value?: number ) =>
					onAdvancedChange( {
						...advanced,
						cache_ttl: value ?? 3600,
					} )
				}
				min={ 0 }
				max={ 86400 }
				step={ 300 }
				help={ __(
					'Configure transient caching lifespan for intensive operations.',
					'wp-ai-ready-plugin-boilerplate'
				) }
			/>

			<SelectControl
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
				label={ __(
					'Uninstall Data Retention Policy',
					'wp-ai-ready-plugin-boilerplate'
				) }
				value={ dataRetention.uninstall_action }
				options={ [
					{
						label: __(
							'Preserve settings and user data (Recommended)',
							'wp-ai-ready-plugin-boilerplate'
						),
						value: 'preserve',
					},
					{
						label: __(
							'Delete options table settings only',
							'wp-ai-ready-plugin-boilerplate'
						),
						value: 'delete_settings',
					},
					{
						label: __(
							'Complete purge: delete all options, posts, and meta',
							'wp-ai-ready-plugin-boilerplate'
						),
						value: 'delete_all',
					},
				] }
				onChange={ ( value: string ) =>
					onDataRetentionChange( {
						...dataRetention,
						uninstall_action:
							value as DataRetentionSettings[ 'uninstall_action' ],
					} )
				}
				help={ __(
					'Determines actions taken if this plugin is permanently uninstalled via WP Admin.',
					'wp-ai-ready-plugin-boilerplate'
				) }
			/>
		</>
	);
}
