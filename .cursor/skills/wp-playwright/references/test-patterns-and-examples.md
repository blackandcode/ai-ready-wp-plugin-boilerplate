# WordPress test patterns and examples

Replace slugs, accessible names, and expected values with project-specific values.

## 1. Plugin admin settings

Use UI interactions because saving the setting is the behavior under test.

```ts
import {
	test,
	expect,
} from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Plugin settings', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'my-plugin' );
	} );

	test( 'saves the enabled setting', async ( { admin, page } ) => {
		await admin.visitAdminPage(
			'options-general.php',
			'page=my-plugin'
		);

		const enabled = page.getByRole( 'checkbox', {
			name: 'Enable diagnostics',
		} );

		await enabled.check();

		await page.getByRole( 'button', {
			name: 'Save Changes',
		} ).click();

		await expect(
			page.getByText( 'Settings saved.' )
		).toBeVisible();

		await page.reload();

		await expect( enabled ).toBeChecked();
	} );
} );
```

The reload assertion verifies persistence rather than only a transient success notice.

## 2. Block registration through the inserter

Use the real inserter when discoverability is part of the contract.

```ts
import {
	test,
	expect,
} from '@wordpress/e2e-test-utils-playwright';

test( 'the Example block is discoverable and insertable', async ( {
	admin,
	page,
	editor,
} ) => {
	await admin.createNewPost();

	await page.getByRole( 'button', {
		name: 'Block Inserter',
	} ).click();

	await page
		.getByRole( 'region', { name: 'Block Library' } )
		.getByRole( 'searchbox' )
		.fill( 'Example' );

	await page
		.getByRole( 'option', {
			name: 'Example',
			exact: true,
		} )
		.click();

	await expect(
		editor.canvas.getByRole( 'document', {
			name: /Block: Example/i,
		} )
	).toBeVisible();
} );
```

## 3. Block behavior without testing the inserter

Use `editor.insertBlock()` when the insertion mechanism is not under test.

```ts
test( 'updates and serializes the Example block', async ( {
	admin,
	editor,
} ) => {
	await admin.createNewPost();

	await editor.insertBlock( {
		name: 'my-plugin/example',
		attributes: {
			message: 'Initial value',
		},
	} );

	const block = editor.canvas.getByRole( 'document', {
		name: /Block: Example/i,
	} );

	await expect( block ).toContainText( 'Initial value' );

	const blocks = await editor.getBlocks();

	expect( blocks ).toMatchObject( [
		{
			name: 'my-plugin/example',
			attributes: {
				message: 'Initial value',
			},
		},
	] );
} );
```

## 4. REST setup and front-end verification

Use REST when the post-creation workflow is not under test.

```ts
test( 'renders the block on the front end', async ( {
	page,
	requestUtils,
} ) => {
	const post = await requestUtils.createPost( {
		status: 'publish',
		title: 'Rendered example',
		content:
			'<!-- wp:my-plugin/example {"message":"Public value"} /-->',
	} );

	await page.goto( post.link );

	await expect(
		page.getByText( 'Public value' )
	).toBeVisible();
} );
```

## 5. Custom REST endpoint

```ts
test( 'runs a diagnostic check', async ( {
	requestUtils,
} ) => {
	const response = await requestUtils.rest< {
		code: string;
		status: 'passed' | 'failed';
	} >( {
		method: 'POST',
		path: '/my-plugin/v1/checks/run',
		data: {
			check: 'rest-api',
		},
	} );

	expect( response ).toMatchObject( {
		code: 'rest-api',
		status: 'passed',
	} );
} );
```

Use a browser test as well when the endpoint result is shown in wp-admin.

## 6. Plugin lifecycle

```ts
test( 'admin page is unavailable while plugin is inactive', async ( {
	admin,
	page,
	requestUtils,
} ) => {
	await requestUtils.deactivatePlugin( 'my-plugin' );

	await page.goto( '/wp-admin/options-general.php?page=my-plugin' );

	await expect(
		page.getByText( /not allowed|cannot load|does not exist/i )
	).toBeVisible();

	await requestUtils.activatePlugin( 'my-plugin' );
	await admin.visitAdminPage(
		'options-general.php',
		'page=my-plugin'
	);
} );
```

Always restore plugin state in `finally` or a teardown if a failed assertion could leave the plugin inactive.

## 7. Permissions

Create the user through REST, but test authorization through the UI or route being protected.

Use a separate browser context with storage state for each role. Do not overwrite the shared administrator state.

Conceptual structure:

```ts
test( 'an editor cannot access administrator settings', async ( {
	browser,
} ) => {
	// Create a role-specific user with requestUtils.
	// Generate a separate storage-state file for that user.
	// Create a new context using that state.
	// Verify the settings page is denied.
} );
```

For the exact multi-user context architecture, also use the `playwright-best-practices` skill.

## 8. Site Editor

```ts
test( 'opens the template in the Site Editor', async ( {
	admin,
	page,
} ) => {
	await admin.visitSiteEditor( {
		path: '/wp_template',
		activeView: 'list',
	} );

	await expect(
		page.getByRole( 'heading', {
			name: 'Templates',
		} )
	).toBeVisible();
} );
```

Site Editor routes and accessible names can change between WordPress/Gutenberg versions. Prefer helpers and semantic assertions, and keep compatibility tests against the supported WordPress versions.

## Assertions to prioritize

Prefer assertions on:

- saved option after reload
- post content after reopening
- serialized block structure
- front-end rendered output
- REST response and persisted record
- correct permission denial
- plugin state after activation/deactivation
- absence of PHP/WordPress page errors
- accessible role, name, state, and focus

A click completing without an error is not sufficient proof that WordPress persisted the result.
