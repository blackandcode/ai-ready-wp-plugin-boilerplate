import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { SettingsShell } from './components/SettingsShell';
import type { PluginSettings, AirwpBootstrapData } from './types';
import './styles/settings.css';

const DEFAULT_SETTINGS: PluginSettings = {
  general: {
    greeting_message: 'Hello from AI-Ready WP Plugin Boilerplate!',
    enable_feature: true,
    description: 'A modern WordPress plugin powered by AI workflows.',
  },
  advanced: {
    rest_debug: false,
    cache_ttl: 3600,
  },
  data_retention: {
    uninstall_action: 'preserve',
  },
};

interface AppProps {
  bootstrap?: AirwpBootstrapData;
}

export function App( { bootstrap }: AppProps ) {
  const initial = bootstrap?.initialSettings || DEFAULT_SETTINGS;
  const [ settings, setSettings ] = useState< PluginSettings >( initial );
  const [ lastSaved, setLastSaved ] = useState< PluginSettings >( initial );
  const [ isSaving, setIsSaving ] = useState( false );
  const [ notice, setNotice ] = useState< { status: 'success' | 'error'; message: string } | null >( null );

  const isDirty = JSON.stringify( settings ) !== JSON.stringify( lastSaved );

  const handleSave = async () => {
    setIsSaving( true );
    setNotice( null );

    try {
      const response = await apiFetch< PluginSettings >( {
        path: '/ai-ready-wp/v1/settings',
        method: 'POST',
        data: settings,
      } );

      setSettings( response );
      setLastSaved( response );
      setNotice( {
        status: 'success',
        message: __( 'Settings successfully saved.', 'ai-ready-wp-plugin-boilerplate' ),
      } );
    } catch ( error: any ) {
      setNotice( {
        status: 'error',
        message:
          error?.message ||
          __( 'Failed to save settings. Please check your permissions.', 'ai-ready-wp-plugin-boilerplate' ),
      } );
    } finally {
      setIsSaving( false );
    }
  };

  const handleReset = () => {
    setSettings( lastSaved );
    setNotice( null );
  };

  return (
    <div className="airwp-app-container">
      { notice && (
        <Notice
          status={ notice.status }
          isDismissible={ true }
          onDismiss={ () => setNotice( null ) }
          style={ { marginBottom: '16px' } }
        >
          { notice.message }
        </Notice>
      ) }

      <SettingsShell
        settings={ settings }
        bootstrap={ bootstrap }
        isDirty={ isDirty }
        isSaving={ isSaving }
        onUpdate={ setSettings }
        onSave={ handleSave }
        onReset={ handleReset }
      />
    </div>
  );
}
