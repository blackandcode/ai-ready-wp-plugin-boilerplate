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

		await settingsPage.switchTab( 'developer' );
		await expect( settingsPage.developerSidebarTab ).toHaveClass(
			/is-active/
		);
	} );

	test( 'renders embedded Developer App with horizontal sub-tabs inside settings card', async ( {
		page,
	} ) => {
		const settingsPage = new SettingsPage( page );
		await settingsPage.goto();

		// In development mode, Developer Tools tab must be visible in the left sidebar.
		await expect( settingsPage.developerSidebarTab ).toBeVisible();
		await settingsPage.switchTab( 'developer' );

		// Card title and embedded app container.
		await expect( settingsPage.settingsCard ).toContainText(
			'Developer Tools'
		);
		await expect( settingsPage.developerApp ).toBeVisible();

		// Save and reset footer buttons should not be present on embedded developer app.
		await expect( settingsPage.saveButton ).not.toBeVisible();
		await expect( settingsPage.resetButton ).not.toBeVisible();

		// Horizontal sub-tabs inside the card.
		await expect( settingsPage.diagnosticsSubTab ).toBeVisible();
		await expect( settingsPage.apiReferenceSubTab ).toBeVisible();

		// Default sub-tab is System Diagnostics.
		await expect( settingsPage.diagnosticsSubTab ).toHaveClass(
			/is-active/
		);
		await expect( settingsPage.diagnosticsTable ).toBeVisible();
		await expect( settingsPage.diagnosticsTable ).toContainText(
			'Boilerplate Version'
		);
		await expect( settingsPage.diagnosticsTable ).toContainText(
			'PHP Runtime'
		);

		// Switch to API Reference sub-tab.
		await settingsPage.switchDeveloperSubTab( 'api-reference' );
		await expect( settingsPage.apiReferenceSubTab ).toHaveClass(
			/is-active/
		);

		// Developer guidance banner is rendered.
		await expect( settingsPage.apiReferenceBanner ).toBeVisible();
		await expect( settingsPage.apiReferenceBadge ).toHaveText(
			'Plugin Development Mode'
		);
		await expect( settingsPage.apiReferenceBanner ).toContainText(
			'docs/api/openapi.yaml'
		);
		await expect( settingsPage.apiReferenceBanner ).toContainText(
			'wp ai-ready openapi generate'
		);

		// Live OpenAPI spec viewer or container should be rendered.
		const specViewer = page.locator(
			'.airwp-api-reference-viewer, .scalar-api-reference'
		);
		await expect( specViewer ).toBeVisible( { timeout: 15_000 } );

		// Switch back to System Diagnostics.
		await settingsPage.switchDeveloperSubTab( 'diagnostics' );
		await expect( settingsPage.diagnosticsSubTab ).toHaveClass(
			/is-active/
		);
		await expect( settingsPage.diagnosticsTable ).toBeVisible();
	} );

	test( 'live development OpenAPI REST endpoint responds with valid contract for authenticated session', async ( {
		page,
	} ) => {
		// Test direct REST API endpoint access via the authenticated admin browser session.
		const response = await page.request.get(
			'/wp-json/ai-ready-wp-dev/v1/openapi'
		);
		expect( response.status() ).toBe( 200 );

		const body = await response.json();
		expect( body.openapi ).toBe( '3.1.0' );
		expect( body.info ).toBeDefined();
		expect( body.info.title ).toContain( 'AI-Ready WP Plugin Boilerplate' );
		expect( body.paths ).toBeDefined();
		expect( body.paths[ '/settings' ] ).toBeDefined();
		expect( body.paths[ '/hello' ] ).toBeDefined();
		expect( body.paths[ '/diagnostics' ] ).toBeDefined();
		// Internal dev endpoint must not expose itself.
		expect( body.paths[ '/openapi' ] ).toBeUndefined();
	} );

	test( 'visual snapshot matches design baseline', async ( { page } ) => {
		const settingsPage = new SettingsPage( page );
		await settingsPage.goto();

		await expect( settingsPage.layoutContainer ).toHaveScreenshot(
			'settings-layout.png'
		);
	} );
} );
