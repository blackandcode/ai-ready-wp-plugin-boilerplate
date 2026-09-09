import {
	TextControl,
	ToggleControl,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { GeneralSettings } from '../../../shared';

interface GeneralSectionProps {
	settings: GeneralSettings;
	onChange: ( updated: GeneralSettings ) => void;
}

export function GeneralSection( { settings, onChange }: GeneralSectionProps ) {
	return (
		<>
			<TextControl
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
				label={ __(
					'Greeting Message',
					'ai-ready-wp-plugin-boilerplate'
				) }
				value={ settings.greeting_message }
				onChange={ ( value: string ) =>
					onChange( { ...settings, greeting_message: value } )
				}
				help={ __(
					'Default greeting text returned by the REST API and displayed in the block.',
					'ai-ready-wp-plugin-boilerplate'
				) }
			/>

			<ToggleControl
				__nextHasNoMarginBottom={ true }
				label={ __(
					'Enable Boilerplate Features',
					'ai-ready-wp-plugin-boilerplate'
				) }
				checked={ settings.enable_feature }
				onChange={ ( checked: boolean ) =>
					onChange( { ...settings, enable_feature: checked } )
				}
				help={ __(
					'Toggle core feature flags for plugin components.',
					'ai-ready-wp-plugin-boilerplate'
				) }
			/>

			<TextareaControl
				__nextHasNoMarginBottom={ true }
				label={ __(
					'Plugin Description & Context',
					'ai-ready-wp-plugin-boilerplate'
				) }
				value={ settings.description }
				onChange={ ( value: string ) =>
					onChange( { ...settings, description: value } )
				}
				rows={ 3 }
				help={ __(
					'High-level summary of this plugin instance for administrators and AI agents.',
					'ai-ready-wp-plugin-boilerplate'
				) }
			/>
		</>
	);
}
