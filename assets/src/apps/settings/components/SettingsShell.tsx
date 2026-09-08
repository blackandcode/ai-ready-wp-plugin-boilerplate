import { useState } from '@wordpress/element';
import { Card, CardHeader, CardBody, CardFooter, Button, Icon } from '@wordpress/components';
import { cog, shield, info } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { GeneralSection } from './GeneralSection';
import { AdvancedSection } from './AdvancedSection';
import { DiagnosticsSection } from './DiagnosticsSection';
import type { PluginSettings, AirwpBootstrapData } from '../types';

export type SettingsTab = 'general' | 'advanced' | 'diagnostics';

interface SettingsShellProps {
  settings: PluginSettings;
  bootstrap?: AirwpBootstrapData;
  isDirty: boolean;
  isSaving: boolean;
  onUpdate: ( updated: PluginSettings ) => void;
  onSave: () => void;
  onReset: () => void;
}

const TABS: Array<{ id: SettingsTab; label: string; icon: any; subtitle: string }> = [
  {
    id: 'general',
    label: __( 'General', 'ai-ready-wp-plugin-boilerplate' ),
    icon: cog,
    subtitle: __( 'Configure greeting message, core toggles, and metadata.', 'ai-ready-wp-plugin-boilerplate' ),
  },
  {
    id: 'advanced',
    label: __( 'Advanced & Retention', 'ai-ready-wp-plugin-boilerplate' ),
    icon: shield,
    subtitle: __( 'Developer controls, debug logging, and data persistence policies.', 'ai-ready-wp-plugin-boilerplate' ),
  },
  {
    id: 'diagnostics',
    label: __( 'System Diagnostics', 'ai-ready-wp-plugin-boilerplate' ),
    icon: info,
    subtitle: __( 'Host environment, PHP runtime, WordPress core, and REST verification.', 'ai-ready-wp-plugin-boilerplate' ),
  },
];

export function SettingsShell( {
  settings,
  bootstrap,
  isDirty,
  isSaving,
  onUpdate,
  onSave,
  onReset,
}: SettingsShellProps ) {
  const [ activeTab, setActiveTab ] = useState< SettingsTab >( 'general' );

  const currentTabMeta = TABS.find( ( t ) => t.id === activeTab ) || TABS[ 0 ];

  return (
    <div className="airwp-settings-layout">
      <nav
        className="airwp-settings-sidebar"
        aria-label={ __( 'Settings Sections', 'ai-ready-wp-plugin-boilerplate' ) }
      >
        <ul className="airwp-sidebar-nav-list">
          { TABS.map( ( tab ) => (
            <li key={ tab.id }>
              <Button
                className={ `airwp-sidebar-tab ${ activeTab === tab.id ? 'is-active' : '' }` }
                onClick={ () => setActiveTab( tab.id ) }
              >
                <Icon icon={ tab.icon } size={ 18 } />
                <span>{ tab.label }</span>
              </Button>
            </li>
          ) ) }
        </ul>
      </nav>

      <main className="airwp-settings-main">
        <Card className="airwp-settings-card">
          <CardHeader className="airwp-card-header">
            <div className="airwp-header-badge">
              <Icon icon={ currentTabMeta.icon } size={ 20 } />
            </div>
            <div>
              <h2 className="airwp-card-title">{ currentTabMeta.label }</h2>
              <p className="airwp-card-subtitle">{ currentTabMeta.subtitle }</p>
            </div>
          </CardHeader>

          <CardBody className="airwp-card-body">
            { activeTab === 'general' && (
              <GeneralSection
                settings={ settings.general }
                onChange={ ( general ) => onUpdate( { ...settings, general } ) }
              />
            ) }

            { activeTab === 'advanced' && (
              <AdvancedSection
                advanced={ settings.advanced }
                dataRetention={ settings.data_retention }
                onAdvancedChange={ ( advanced ) =>
                  onUpdate( { ...settings, advanced } )
                }
                onDataRetentionChange={ ( data_retention ) =>
                  onUpdate( { ...settings, data_retention } )
                }
              />
            ) }

            { activeTab === 'diagnostics' && (
              <DiagnosticsSection
                environment={ bootstrap?.environment }
                version={ bootstrap?.version }
              />
            ) }
          </CardBody>

          { activeTab !== 'diagnostics' && (
            <CardFooter className="airwp-card-footer">
              <div
                className={ `airwp-save-status ${ isDirty ? 'is-dirty' : '' }` }
              >
                { isDirty
                  ? __( 'You have unsaved changes', 'ai-ready-wp-plugin-boilerplate' )
                  : __( 'All changes saved', 'ai-ready-wp-plugin-boilerplate' ) }
              </div>
              <div style={ { display: 'flex', gap: '8px' } }>
                <Button
                  variant="tertiary"
                  disabled={ ! isDirty || isSaving }
                  onClick={ onReset }
                >
                  { __( 'Reset', 'ai-ready-wp-plugin-boilerplate' ) }
                </Button>
                <Button
                  variant="primary"
                  isBusy={ isSaving }
                  disabled={ ! isDirty || isSaving }
                  onClick={ onSave }
                >
                  { __( 'Save Settings', 'ai-ready-wp-plugin-boilerplate' ) }
                </Button>
              </div>
            </CardFooter>
          ) }
        </Card>
      </main>
    </div>
  );
}
