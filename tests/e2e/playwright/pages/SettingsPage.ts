/**
 * Page Object Model for the Plugin Settings Admin Screen.
 *
 * Encapsulates selectors, user interactions, and state assertions for Playwright.
 *
 * @package
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class SettingsPage {
	public readonly page: Page;
	public readonly pageHeading: Locator;
	public readonly appContainer: Locator;
	public readonly settingsCard: Locator;
	public readonly sidebarNav: Locator;
	public readonly generalTab: Locator;
	public readonly advancedTab: Locator;
	public readonly diagnosticsTab: Locator;
	public readonly greetingInput: Locator;
	public readonly descriptionInput: Locator;
	public readonly featureToggle: Locator;
	public readonly saveButton: Locator;
	public readonly resetButton: Locator;
	public readonly noticeBanner: Locator;
	public readonly layoutContainer: Locator;

	constructor( page: Page ) {
		this.page = page;
		this.pageHeading = page.locator( 'h1.wp-heading-inline' );
		this.appContainer = page.locator( '.airwp-app-container' );
		this.settingsCard = page.locator( '.airwp-settings-card' );
		this.sidebarNav = page.locator( '.airwp-settings-sidebar' );
		this.generalTab = page.locator( '.airwp-sidebar-tab' ).filter( { hasText: 'General' } );
		this.advancedTab = page.locator( '.airwp-sidebar-tab' ).filter( { hasText: 'Advanced' } );
		this.diagnosticsTab = page.locator( '.airwp-sidebar-tab' ).filter( { hasText: 'Diagnostics' } );
		this.greetingInput = page.locator( 'input[type="text"]' ).first();
		this.descriptionInput = page.locator( 'textarea' );
		this.featureToggle = page.locator( '.components-form-toggle__input' ).first();
		this.saveButton = page.getByRole( 'button', { name: 'Save Settings' } );
		this.resetButton = page.getByRole( 'button', { name: 'Reset' } );
		this.noticeBanner = page.locator( '.airwp-notice-banner' );
		this.layoutContainer = page.locator( '.airwp-settings-layout' );
	}

	/**
	 * Navigate to the Settings admin screen and wait until ready.
	 */
	public async goto(): Promise< void > {
		await this.page.goto( '/wp-admin/admin.php?page=airwp-settings' );
		await this.waitForReady();
	}

	/**
	 * Wait until the app container signals readiness.
	 */
	public async waitForReady(): Promise< void > {
		await expect( this.pageHeading ).toBeVisible();
		await expect( this.settingsCard ).toBeVisible();
		await expect( this.appContainer ).toHaveAttribute( 'data-airwp-app-state', 'ready' );
	}

	/**
	 * Switch between settings sidebar tabs.
	 */
	public async switchTab( tab: 'general' | 'advanced' | 'diagnostics' ): Promise< void > {
		switch ( tab ) {
			case 'general':
				await this.generalTab.click();
				break;
			case 'advanced':
				await this.advancedTab.click();
				break;
			case 'diagnostics':
				await this.diagnosticsTab.click();
				break;
		}
	}

	/**
	 * Update greeting message.
	 */
	public async updateGreeting( text: string ): Promise< void > {
		await this.greetingInput.fill( text );
	}

	/**
	 * Save settings changes.
	 */
	public async save(): Promise< void > {
		await this.saveButton.click();
		await expect( this.appContainer ).toHaveAttribute( 'data-airwp-app-state', 'ready' );
	}
}
