# Setup and configuration

## Preferred stack

For a plugin or theme repository:

```bash
npm install --save-dev \
	@playwright/test \
	@wordpress/e2e-test-utils-playwright \
	@wordpress/scripts \
	@wordpress/env
```

Install browser binaries:

```bash
npx playwright install --with-deps
```

Commit the lockfile. The WordPress package has changed quickly over time, and its public documentation has occasionally lagged behind the published package.

## Environment variables

The WordPress test utils recognize these variables:

```bash
WP_BASE_URL=http://localhost:8889
WP_USERNAME=admin
WP_PASSWORD=password
STORAGE_STATE_PATH=artifacts/storage-states/admin.json
```

The `@wordpress/scripts` base configuration also supports:

```bash
WP_ARTIFACTS_PATH=artifacts
TIMEOUT=100000
CI=true
```

Keep `WP_BASE_URL` consistent between:

- Playwright `use.baseURL`
- `RequestUtils`
- global setup
- the actual WordPress installation

Include a subdirectory when WordPress is installed in one:

```bash
WP_BASE_URL=https://example.test/wordpress/
```

Do not commit real credentials.

## `wp-env`

When run from a plugin directory, `wp-env` can mount and activate the current plugin automatically.

Minimal `.wp-env.json`:

```json
{
	"$schema": "https://schemas.wp.org/trunk/wp-env.json",
	"core": null,
	"plugins": [ "." ],
	"config": {
		"WP_DEBUG": true,
		"SCRIPT_DEBUG": true
	}
}
```

Suggested scripts:

```json
{
	"scripts": {
		"wp-env": "wp-env",
		"test:e2e": "wp-scripts test-playwright",
		"test:e2e:ui": "wp-scripts test-playwright --ui",
		"test:e2e:debug": "wp-scripts test-playwright --debug"
	}
}
```

The test site normally runs at `http://localhost:8889`; the development site normally runs at `http://localhost:8888`.

## Recommended Playwright configuration

Use the WordPress Scripts base configuration whenever possible:

```js
// playwright.config.js
export { default } from '@wordpress/scripts/config/playwright.config.js';
```

To change only project-specific fields:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import baseConfig from '@wordpress/scripts/config/playwright.config.js';

export default defineConfig( {
	...baseConfig,
	testDir: './tests/e2e',
} );
```

When overriding nested properties, merge them instead of replacing them accidentally:

```ts
export default defineConfig( {
	...baseConfig,
	use: {
		...baseConfig.use,
		trace: 'retain-on-failure',
	},
	webServer: {
		...baseConfig.webServer,
		command: 'npm run wp-env -- start',
	},
} );
```

The WordPress base configuration currently provides useful defaults including:

- one worker
- Chromium
- persisted admin storage state
- global authentication setup
- reduced motion
- strict selectors
- trace and screenshot artifacts on failure
- automatic `wp-env` startup
- `specs/` as the default test directory

## Custom configuration

A custom configuration must preserve WordPress authentication.

```ts
// playwright.config.ts
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.WP_BASE_URL ?? 'http://localhost:8889';
const storageState =
	process.env.STORAGE_STATE_PATH ??
	path.join( process.cwd(), 'artifacts/storage-states/admin.json' );

export default defineConfig( {
	testDir: './tests/e2e',
	workers: 1,
	forbidOnly: Boolean( process.env.CI ),
	retries: process.env.CI ? 2 : 0,
	globalSetup: './tests/e2e/global-setup.ts',
	use: {
		baseURL,
		storageState,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
		ignoreHTTPSErrors: true,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
	],
	webServer: {
		command: 'npm run wp-env -- start',
		url: baseURL,
		reuseExistingServer: true,
		timeout: 120_000,
	},
} );
```

Custom global setup:

```ts
// tests/e2e/global-setup.ts
import { request, type FullConfig } from '@playwright/test';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

export default async function globalSetup( config: FullConfig ) {
	const { baseURL, storageState } = config.projects[ 0 ].use;

	if ( ! baseURL ) {
		throw new Error( 'Playwright baseURL is required.' );
	}
	if ( typeof storageState !== 'string' ) {
		throw new Error( 'A storageState file path is required.' );
	}

	const requestContext = await request.newContext( { baseURL } );
	const requestUtils = new RequestUtils( requestContext, {
		baseURL,
		storageStatePath: storageState,
	} );

	try {
		await requestUtils.setupRest();
	} finally {
		await requestContext.dispose();
	}
}
```

Important: set `WP_BASE_URL` before the process starts. REST discovery in the package uses that environment variable.

## Running tests

```bash
npm run test:e2e
npm run test:e2e -- tests/e2e/admin-settings.spec.ts
npm run test:e2e -- --headed
npm run test:e2e -- --debug
npm run test:e2e:ui
```

For a critical test:

```bash
npm run test:e2e -- tests/e2e/critical-flow.spec.ts --repeat-each=5
```

Do not rely on retries as the first response to an unstable test.
