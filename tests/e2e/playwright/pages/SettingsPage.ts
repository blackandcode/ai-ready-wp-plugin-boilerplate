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
	public readonly developerSidebarTab: Locator;
	public readonly developerApp: Locator;
	public readonly diagnosticsSubTab: Locator;
	public readonly apiReferenceSubTab: Locator;
	public readonly diagnosticsTable: Locator;
	public readonly apiReferenceBanner: Locator;
	public readonly apiReferenceBadge: Locator;
	public readonly greetingInput: Locator;
	public readonly descriptionInput: Locator;
	public readonly featureToggle: Locator;
	public readonly saveButton: Locator;
	public readonly resetButton: Locator;
	public readonly noticeBanner: Locator;
	public readonly layoutContainer: Locator;
	public readonly cardHeader: Locator;
	public readonly cardHeaderContent: Locator;
	public readonly headerBadge: Locator;
	public readonly cardTitle: Locator;
	public readonly cardSubtitle: Locator;

	constructor( page: Page ) {
		this.page = page;
		this.pageHeading = page.locator( 'h1.wp-heading-inline' );
		this.appContainer = page.locator( '.wpaibp-app-container' );
		this.settingsCard = page.locator( '.wpaibp-settings-card' );
		this.cardHeader = page.locator( '.wpaibp-card-header' );
		this.cardHeaderContent = page.locator( '.wpaibp-header-content' );
		this.headerBadge = page.locator( '.wpaibp-header-badge' );
		this.cardTitle = page.locator( '.wpaibp-card-title' );
		this.cardSubtitle = page.locator( '.wpaibp-card-subtitle' );
		this.sidebarNav = page.locator( '.wpaibp-settings-sidebar' );
		this.generalTab = page
			.locator( '.wpaibp-sidebar-tab' )
			.filter( { hasText: 'General' } );
		this.advancedTab = page
			.locator( '.wpaibp-sidebar-tab' )
			.filter( { hasText: 'Advanced' } );
		this.developerSidebarTab = page
			.locator( '.wpaibp-sidebar-tab' )
			.filter( { hasText: 'Developer Tools' } );
		this.developerApp = page.locator( '.wpaibp-developer-app' );
		this.diagnosticsSubTab = page
			.locator( '.wpaibp-dev-subtab' )
			.filter( { hasText: 'System Diagnostics' } );
		this.apiReferenceSubTab = page
			.locator( '.wpaibp-dev-subtab' )
			.filter( { hasText: 'API Reference' } );
		this.diagnosticsTable = page.locator( '.wpaibp-diagnostics-table' );
		this.apiReferenceBanner = page.locator( '.wpaibp-dev-reference-banner' );
		this.apiReferenceBadge = page.locator( '.wpaibp-dev-banner-badge' );
		this.greetingInput = page.locator( 'input[type="text"]' ).first();
		this.descriptionInput = page.locator( 'textarea' );
		this.featureToggle = page
			.locator( '.components-form-toggle__input' )
			.first();
		this.saveButton = page.getByRole( 'button', { name: 'Save Settings' } );
		this.resetButton = page.getByRole( 'button', { name: 'Reset' } );
		this.noticeBanner = page.locator( '.wpaibp-notice-banner' );
		this.layoutContainer = page.locator( '.wpaibp-settings-layout' );
	}

	/**
	 * Navigate to the Settings admin screen and wait until ready.
	 */
	public async goto(): Promise< void > {
		await this.page.goto( '/wp-admin/admin.php?page=wpaibp-settings' );
		await this.waitForReady();
	}

	/**
	 * Wait until the app container signals readiness.
	 */
	public async waitForReady(): Promise< void > {
		await expect( this.pageHeading ).toBeVisible();
		await expect( this.settingsCard ).toBeVisible();
		await expect( this.appContainer ).toHaveAttribute(
			'data-wpaibp-app-state',
			'ready'
		);
	}

	/**
	 * Switch between settings sidebar tabs.
	 */
	public async switchTab(
		tab: 'general' | 'advanced' | 'developer'
	): Promise< void > {
		switch ( tab ) {
			case 'general':
				await this.generalTab.click();
				break;
			case 'advanced':
				await this.advancedTab.click();
				break;
			case 'developer':
				await this.developerSidebarTab.click();
				break;
		}
	}

	/**
	 * Switch between Developer app horizontal sub-tabs inside the card.
	 */
	public async switchDeveloperSubTab(
		subTab: 'diagnostics' | 'api-reference'
	): Promise< void > {
		switch ( subTab ) {
			case 'diagnostics':
				await this.diagnosticsSubTab.click();
				break;
			case 'api-reference':
				await this.apiReferenceSubTab.click();
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
		await expect( this.appContainer ).toHaveAttribute(
			'data-wpaibp-app-state',
			'ready'
		);
	}

	/**
	 * Verify that the card header title is positioned on the left side of the card,
	 * immediately adjacent to the header icon badge.
	 */
	public async expectCardHeaderAlignedLeft(): Promise< void > {
		await expect( this.cardHeader ).toBeVisible();
		await expect( this.headerBadge ).toBeVisible();
		await expect( this.cardTitle ).toBeVisible();

		const cardBox = await this.settingsCard.boundingBox();
		const badgeBox = await this.headerBadge.boundingBox();
		const titleBox = await this.cardTitle.boundingBox();

		expect( cardBox ).not.toBeNull();
		expect( badgeBox ).not.toBeNull();
		expect( titleBox ).not.toBeNull();

		if ( cardBox && badgeBox && titleBox ) {
			// Title must start immediately after the icon badge with standard spacing (< 30px gap).
			const gap = titleBox.x - ( badgeBox.x + badgeBox.width );
			expect( gap ).toBeGreaterThanOrEqual( 0 );
			expect( gap ).toBeLessThanOrEqual( 30 );

			// Title must be positioned in the left portion of the card (not pushed to the right edge).
			const relativeTitleStart = titleBox.x - cardBox.x;
			expect( relativeTitleStart ).toBeLessThan( cardBox.width / 2 );
		}
	}
}
