# WordPress fixtures and APIs

## Fixture selection

| Fixture | Use it for |
|---|---|
| `admin` | wp-admin navigation, creating/editing posts, opening Site Editor |
| `editor` | Block Editor and Site Editor operations |
| `editor.canvas` | Locating blocks inside the editor iframe |
| `pageUtils` | WordPress-aware keyboard, viewport, clipboard, drag/drop, and network helpers |
| `requestUtils` | REST setup, content factories, plugin/theme state, users, media, preferences, settings |
| `page` | Standard Playwright interactions with admin chrome and front end |

## `admin`

Current public helpers include:

```ts
await admin.visitAdminPage( 'options-general.php' );
await admin.visitAdminPage(
	'admin.php',
	'page=my-plugin'
);

await admin.createNewPost( {
	postType: 'page',
	title: 'E2E page',
	content: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
	showWelcomeGuide: false,
	fullscreenMode: false,
} );

await admin.editPost( postId );

await admin.visitSiteEditor( {
	path: '/wp_template',
	canvas: 'edit',
} );
```

`visitAdminPage()` detects a login redirect and throws `Not logged in`. It also handles the WordPress database-upgrade screen and checks for page-level WordPress errors.

## `editor`

Current helpers include:

```ts
await editor.insertBlock( {
	name: 'my-plugin/example',
	attributes: {
		message: 'Hello',
	},
} );

await editor.setContent(
	'<!-- wp:my-plugin/example {"message":"Hello"} /-->'
);

const blocks = await editor.getBlocks();

const serialized = await editor.getEditedPostContent();

await editor.openDocumentSettingsSidebar();
await editor.saveDraft();
const postId = await editor.publishPost();
```

`editor.insertBlock()` uses WordPress's `wp.blocks.createBlock()` and `wp.data` APIs. It is appropriate when the test does not need to verify the inserter UI.

Use the inserter UI when registration, searchability, category placement, variation discovery, or insertion by a real user is the behavior under test.

### Canvas versus chrome

```ts
// Content inside the iframe.
const block = editor.canvas.getByRole( 'document', {
	name: /Block: Example/i,
} );

// Controls outside the iframe.
const saveButton = page
	.getByRole( 'region', { name: 'Editor top bar' } )
	.getByRole( 'button', { name: /Save|Publish/ } );
```

The canvas iframe is named `editor-canvas`. Use `editor.canvas` instead of creating another frame locator unless the project uses a nonstandard editor.

## `requestUtils`

The fixture supports a broad WordPress REST setup API. Useful methods include:

```ts
await requestUtils.setupRest();

await requestUtils.activatePlugin( 'my-plugin' );
await requestUtils.deactivatePlugin( 'my-plugin' );

const post = await requestUtils.createPost( {
	status: 'publish',
	title: 'Example',
	content: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
} );

await requestUtils.deleteAllPosts();
await requestUtils.deleteAllPosts( 'my_custom_post_type' );
await requestUtils.deleteAllPages();

await requestUtils.createPage( /* payload */ );
await requestUtils.createUser( /* payload */ );
await requestUtils.uploadMedia( /* file */ );
await requestUtils.updateSiteSettings( /* settings */ );
await requestUtils.setPreferences( /* preferences */ );
```

Call a plugin REST endpoint directly:

```ts
const result = await requestUtils.rest< {
	status: string;
} >( {
	method: 'POST',
	path: '/my-plugin/v1/run-check',
	data: {
		check: 'loopback',
	},
} );

expect( result.status ).toBe( 'passed' );
```

Batch REST calls when many independent setup records are needed:

```ts
const responses = await requestUtils.batchRest( [
	{
		method: 'POST',
		path: '/wp/v2/posts',
		body: {
			status: 'publish',
			title: 'First',
		},
	},
	{
		method: 'POST',
		path: '/wp/v2/posts',
		body: {
			status: 'publish',
			title: 'Second',
		},
	},
] );
```

## Authentication model

The package uses a standard WordPress form login through `wp-login.php`, fetches a REST nonce from:

```text
wp-admin/admin-ajax.php?action=rest-nonce
```

It then stores:

- cookies
- REST nonce
- REST root URL

in the configured storage-state file.

The global setup must complete before Playwright creates browser contexts.

This package assumes standard WordPress authentication. Sites using OIDC, SAML, custom login URLs, disabled `admin-ajax.php`, reverse-proxy rewrites, or security plugins may require a project-specific authentication setup.

## Test setup and cleanup

A safe pattern:

```ts
import {
	test,
	expect,
} from '@wordpress/e2e-test-utils-playwright';

test.beforeAll( async ( { requestUtils } ) => {
	await requestUtils.activatePlugin( 'my-plugin' );
} );

test.afterEach( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
	await requestUtils.deleteAllPages();
} );
```

Prefer deleting only records created by the test when the shared environment contains fixtures required by other tests.

For large suites, create a project-specific data factory using `requestUtils.rest()` rather than repeating raw payloads.
