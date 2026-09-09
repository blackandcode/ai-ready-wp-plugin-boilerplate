import { test, expect } from '@playwright/test';
import { SettingsPage } from '../pages/SettingsPage';

test.describe( 'Settings Admin Application (Page Object Model)', () => {
	test( 'loads settings page and displays WordPress AI Boilerplate title', async ( {
		page,
	} ) => {
		const settingsPage = new SettingsPage( page );
		await settingsPage.goto();

		await expect( settingsPage.pageHeading ).toContainText( 'Settings' );
		await expect( settingsPage.settingsCard ).toBeVisible();
		await expect( settingsPage.generalTab ).toHaveClass( /is-active/ );
	} );

	test( 'switches between tabs cleanly', async ( { page } ) => {
		const settingsPage = new SettingsPage( page );
		await settingsPage.goto();

		await settingsPage.switchTab( 'advanced' );
		await expect( settingsPage.advancedTab ).toHaveClass( /is-active/ );

		await settingsPage.switchTab( 'diagnostics' );
		await expect( settingsPage.diagnosticsTab ).toHaveClass( /is-active/ );
	} );

	test( 'visual snapshot matches design baseline', async ( { page } ) => {
		const settingsPage = new SettingsPage( page );
		await settingsPage.goto();

		await expect( settingsPage.layoutContainer ).toHaveScreenshot( 'settings-layout.png' );
	} );
} );
