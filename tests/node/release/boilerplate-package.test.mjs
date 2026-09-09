import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
	buildBoilerplatePackage,
	isBoilerplateExcluded,
} from '../../../tools/release/build-boilerplate-package.mjs';
import { validateBoilerplatePackage } from '../../../tools/release/validate-boilerplate-package.mjs';
import { createZip } from '../../../tools/release/lib/zip-utils.mjs';

test( 'isBoilerplateExcluded filters dev artifacts, cache, and secrets correctly', () => {
	// Must be excluded
	assert.equal( isBoilerplateExcluded( '.git', true ), true );
	assert.equal( isBoilerplateExcluded( '.git/HEAD', false ), true );
	assert.equal( isBoilerplateExcluded( 'node_modules', true ), true );
	assert.equal( isBoilerplateExcluded( 'node_modules/react', true ), true );
	assert.equal( isBoilerplateExcluded( 'dist/starter.zip', false ), true );
	assert.equal( isBoilerplateExcluded( 'dist-extracted/plugin', true ), true );
	assert.equal( isBoilerplateExcluded( 'tests/.phpunit.cache/file', false ), true );
	assert.equal( isBoilerplateExcluded( 'playwright-report/index.html', false ), true );
	assert.equal( isBoilerplateExcluded( 'tests/playwright-report/index.html', false ), true );
	assert.equal( isBoilerplateExcluded( 'test-results/test.log', false ), true );
	assert.equal( isBoilerplateExcluded( 'coverage/lcov.info', false ), true );
	assert.equal( isBoilerplateExcluded( 'tests/bruno/reports/report.json', false ), true );
	assert.equal( isBoilerplateExcluded( '.env', false ), true );
	assert.equal( isBoilerplateExcluded( '.env.local', false ), true );
	assert.equal( isBoilerplateExcluded( 'debug.log', false ), true );
	assert.equal( isBoilerplateExcluded( '.DS_Store', false ), true );
	assert.equal( isBoilerplateExcluded( 'Thumbs.db', false ), true );

	// Must NOT be excluded (critical starter template files)
	assert.equal( isBoilerplateExcluded( '.env.example', false ), false );
	assert.equal( isBoilerplateExcluded( 'package.json', false ), false );
	assert.equal( isBoilerplateExcluded( 'composer.json', false ), false );
	assert.equal( isBoilerplateExcluded( '.cursor/rules/wp-admin-ui-ux.mdc', false ), false );
	assert.equal( isBoilerplateExcluded( 'src/development/Cli/Command.php', false ), false );
	assert.equal( isBoilerplateExcluded( 'src/frontend/apps/settings/react/App.tsx', false ), false );
	assert.equal( isBoilerplateExcluded( 'tests/phpunit/unit/PluginTest.php', false ), false );
	assert.equal( isBoilerplateExcluded( 'tools/scaffolding/scaffold-plugin.mjs', false ), false );
	assert.equal( isBoilerplateExcluded( 'docs/adr/README.md', false ), false );
	assert.equal( isBoilerplateExcluded( 'README.md', false ), false );
	assert.equal( isBoilerplateExcluded( 'build/admin/settings/index.js', false ), false );
} );

test( 'buildBoilerplatePackage builds compliant starter archive in isolated staging', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-build-boilerplate-' )
	);

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'my-starter', version: '2.1.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'composer.json' ),
			JSON.stringify( { name: 'my-vendor/my-starter' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'my-starter.php' ),
			`<?php
/**
 * Plugin Name: My Starter
 * Version: 2.1.0
 * Text Domain: my-starter
 */
`
		);

		await writeFile(
			join( tempDir, 'readme.txt' ),
			'=== My Starter ===\nStable tag: 2.1.0\n'
		);
		await writeFile( join( tempDir, 'uninstall.php' ), '<?php\n' );
		await writeFile( join( tempDir, 'README.md' ), '# My Starter\n' );
		await writeFile( join( tempDir, 'CHANGELOG.md' ), '# Changelog\n' );
		await writeFile( join( tempDir, '.env.example' ), 'WP_ENV=development\n' );

		// Developer assets that must be preserved
		await mkdir( join( tempDir, '.cursor/rules' ), { recursive: true } );
		await writeFile(
			join( tempDir, '.cursor/rules/rule.mdc' ),
			'# Cursor Rule'
		);

		await mkdir( join( tempDir, 'src/development/Cli' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'src/development/Cli/DevCommand.php' ),
			'<?php class DevCommand {}'
		);

		await mkdir( join( tempDir, 'src/frontend/apps/settings/react' ), {
			recursive: true,
		} );
		await writeFile(
			join( tempDir, 'src/frontend/apps/settings/react/App.tsx' ),
			'export const App = () => null;'
		);

		await mkdir( join( tempDir, 'tests/phpunit' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'tests/phpunit/Test.php' ),
			'<?php class Test {}'
		);

		await mkdir( join( tempDir, 'tools/scaffolding' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'tools/scaffolding/scaffold-plugin.mjs' ),
			'// scaffolding'
		);

		await mkdir( join( tempDir, 'docs' ), { recursive: true } );
		await writeFile( join( tempDir, 'docs/index.md' ), '# Documentation' );

		// Runtime compiled assets
		await mkdir( join( tempDir, 'build/admin/settings' ), {
			recursive: true,
		} );
		await writeFile(
			join( tempDir, 'build/admin/settings/index.js' ),
			'console.log("settings");'
		);
		await writeFile(
			join( tempDir, 'build/blocks-manifest.php' ),
			'<?php return [];'
		);

		await mkdir( join( tempDir, 'build/blocks/hello-world' ), {
			recursive: true,
		} );
		await writeFile(
			join( tempDir, 'build/blocks/hello-world/block.json' ),
			JSON.stringify( { name: 'hello-world' } )
		);

		// Vendor mock
		await mkdir( join( tempDir, 'vendor' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'vendor/autoload.php' ),
			'<?php // autoloader'
		);

		// Files that must be excluded
		await mkdir( join( tempDir, '.git' ), { recursive: true } );
		await writeFile( join( tempDir, '.git/config' ), '[core]' );

		await mkdir( join( tempDir, 'node_modules/fake' ), { recursive: true } );
		await writeFile( join( tempDir, 'node_modules/fake/index.js' ), '' );

		await writeFile( join( tempDir, '.env' ), 'SECRET=forbidden' );

		const result = await buildBoilerplatePackage( {
			root: tempDir,
			outDir: 'dist',
			skipBuild: true,
			unsafeSkipComposer: true,
		} );

		assert.equal( result.slug, 'my-starter' );
		assert.equal( result.version, '2.1.0' );
		assert.match( result.zipPath, /my-starter-starter-2\.1\.0\.zip$/ );
		assert.match( result.sha256Path, /my-starter-starter-2\.1\.0\.zip\.sha256$/ );
		assert.match(
			result.filesJsonPath,
			/my-starter-starter-2\.1\.0\.files\.json$/
		);

		// Validate with validateBoilerplatePackage
		const validation = await validateBoilerplatePackage( result.zipPath, {
			root: tempDir,
		} );
		assert.equal( validation.valid, true );
		assert.equal(
			validation.checks.every( ( c ) => c.pass ),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'validateBoilerplatePackage flags missing assets and leaked node_modules or .git', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-validate-boilerplate-bad-' )
	);
	const zipPath = join( tempDir, 'dist/test-starter-1.0.0.zip' );

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'test-starter', version: '1.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'test-starter.php' ),
			`<?php
/**
 * Plugin Name: Test Starter
 * Version: 1.0.0
 * Text Domain: test-starter
 */
`
		);

		// Incomplete starter ZIP containing forbidden .git and node_modules, missing vendor/autoload
		const entries = [
			{ path: 'test-starter/test-starter.php', data: '<?php' },
			{ path: 'test-starter/package.json', data: '{}' },
			{ path: 'test-starter/.git/HEAD', data: 'ref: refs/heads/main' },
			{ path: 'test-starter/node_modules/react/index.js', data: '' },
		];

		await createZip( entries, zipPath );

		const result = await validateBoilerplatePackage( zipPath, {
			root: tempDir,
		} );
		assert.equal( result.valid, false );

		const failedCheckNames = result.checks
			.filter( ( c ) => ! c.pass )
			.map( ( c ) => c.name );

		assert.equal(
			failedCheckNames.some( ( n ) => n.includes( 'autoload' ) ),
			true
		);
		assert.equal(
			failedCheckNames.some( ( n ) => n.includes( 'node_modules' ) ),
			true
		);
		assert.equal(
			failedCheckNames.some( ( n ) => n.includes( 'Git repository' ) ),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
