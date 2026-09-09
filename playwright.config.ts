import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve( process.cwd(), '.env' );
if ( existsSync( envPath ) ) {
	const content = readFileSync( envPath, 'utf-8' );
	for ( const line of content.split( '\n' ) ) {
		const trimmed = line.trim();
		if ( ! trimmed || trimmed.startsWith( '#' ) ) {
			continue;
		}
		const eqIdx = trimmed.indexOf( '=' );
		if ( eqIdx !== -1 ) {
			const key = trimmed.slice( 0, eqIdx ).trim();
			const val = trimmed.slice( eqIdx + 1 ).trim();
			if ( ! process.env[ key ] ) {
				process.env[ key ] = val;
			}
		}
	}
}

const baseURL = process.env.WP_BASE_URL ?? 'http://localhost:8888';

export default defineConfig( {
	testDir: './tests/e2e/playwright',
	testMatch: [ '**/*.spec.ts' ],
	fullyParallel: false,
	forbidOnly: Boolean( process.env.CI ),
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : 1,
	timeout: 45_000,
	expect: {
		timeout: 10_000,
		toHaveScreenshot: {
			animations: 'disabled',
			caret: 'hide',
			scale: 'css',
			maxDiffPixelRatio: 0.01,
		},
	},
	reporter: process.env.CI
		? [
				[ 'line' ],
				[
					'html',
					{ open: 'never', outputFolder: 'tests/playwright-report' },
				],
				[ 'junit', { outputFile: 'tests/test-results/playwright/e2e.xml' } ],
		  ]
		: [
				[ 'list' ],
				[
					'html',
					{ open: 'never', outputFolder: 'tests/playwright-report' },
				],
		  ],
	use: {
		baseURL,
		locale: 'en-US',
		timezoneId: 'Europe/Belgrade',
		colorScheme: 'light',
		reducedMotion: 'reduce',
		viewport: { width: 1440, height: 1000 },
		deviceScaleFactor: 2,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		acceptDownloads: true,
	},
	projects: [
		{
			name: 'setup',
			testMatch: /.*auth\.setup\.ts/,
		},
		{
			name: 'chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				storageState: 'tests/e2e/playwright/.auth/admin.json',
			},
			dependencies: [ 'setup' ],
		},
	],
	outputDir: 'tests/test-results/playwright',
	snapshotPathTemplate:
		'{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
} );
