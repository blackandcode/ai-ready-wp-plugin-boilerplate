import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import {
	detectCurrentPlugin,
	scaffoldPlugin,
} from '../../../tools/scaffolding/scaffold-engine.mjs';

const testDirectory = dirname( fileURLToPath( import.meta.url ) );
const projectRoot = resolve( testDirectory, '../../..' );
const fixtureRoot = join(
	projectRoot,
	'tests/fixtures/versioning/sample-plugin'
);
const cliPath = join( projectRoot, 'tools/scaffolding/scaffold-plugin.mjs' );

async function createFixture() {
	const directory = await mkdtemp( join( tmpdir(), 'wpaibp-scaffold-test-' ) );
	await cp( fixtureRoot, directory, { recursive: true } );
	return directory;
}

test( 'scaffoldPlugin performs atomic renaming and token replacement', async () => {
	const root = await createFixture();
	try {
		const result = await scaffoldPlugin( {
			root,
			name: 'Diagram Pro',
			slug: 'diagram-pro',
			namespace: 'Acme\\DiagramPro',
			prefix: 'DP_',
			author: 'Acme Corp',
			description: 'Advanced diagramming plugin.',
			restNamespace: 'dp/v1',
			blockName: 'dp/flowchart',
			dryRun: false,
		} );

		assert.equal( result.target.slug, 'diagram-pro' );
		assert.equal( result.target.name, 'Diagram Pro' );
		assert.equal( result.target.prefix, 'DP_' );
		assert.ok( result.modifiedCount > 0 );
		assert.ok( result.renamedCount > 0 );

		// Verify main file renamed
		const mainPhp = await readFile(
			join( root, 'diagram-pro.php' ),
			'utf8'
		);
		assert.match( mainPhp, /Plugin Name: Diagram Pro/ );
		assert.match( mainPhp, /define\(\s*'DP_VERSION'/ );

		// Verify package.json updated
		const packageJson = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( packageJson.name, 'diagram-pro' );

		// Verify composer.json updated
		const composerJson = JSON.parse(
			await readFile( join( root, 'composer.json' ), 'utf8' )
		);
		assert.match( composerJson.name, /diagram-pro/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffold CLI supports --dry-run without modifying files', async () => {
	const root = await createFixture();
	try {
		const originalPackage = await readFile(
			join( root, 'package.json' ),
			'utf8'
		);

		const cli = spawnSync(
			process.execPath,
			[
				cliPath,
				'--root',
				root,
				'--name',
				'Dry Run Plugin',
				'--slug',
				'dry-run-plugin',
				'--dry-run',
			],
			{ cwd: projectRoot, encoding: 'utf8' }
		);

		assert.equal( cli.status, 0, cli.stderr );
		assert.match( cli.stdout, /DRY RUN/ );
		assert.match( cli.stdout, /Dry run completed/ );

		const packageAfter = await readFile(
			join( root, 'package.json' ),
			'utf8'
		);
		assert.equal( packageAfter, originalPackage );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffoldPlugin replaces hyphenated prefix, PascalCase, camelCase tokens, and dynamic REST/block tokens', async () => {
	const root = await createFixture();
	try {
		// Add mock REST controller and block.json
		await mkdir( join( root, 'src/backend/Apps/HelloWorld/Rest' ), {
			recursive: true,
		} );
		await writeFile(
			join(
				root,
				'src/backend/Apps/HelloWorld/Rest/HelloWorldController.php'
			),
			"<?php\nclass HelloWorldController {\n  protected $namespace = 'dynamic-api/v1';\n}\n"
		);
		await mkdir( join( root, 'src/frontend/apps/hello-world' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/frontend/apps/hello-world/block.json' ),
			JSON.stringify( { name: 'dynamic-vendor/dynamic-block' } )
		);

		// Add mock UI file with hyphenated prefix and camelCase bootstrap
		await writeFile(
			join( root, 'mock-ui.js' ),
			'const cls = "sample-plugin-settings";\nconst data = window.samplePluginAdminBootstrap;\n'
		);

		const detected = await detectCurrentPlugin( root );
		assert.equal( detected.restNamespace, 'dynamic-api/v1' );
		assert.equal( detected.blockName, 'dynamic-vendor/dynamic-block' );

		const result = await scaffoldPlugin( {
			root,
			name: 'Diagram Pro',
			slug: 'diagram-pro',
			namespace: 'Acme\\DiagramPro',
			prefix: 'DP_',
			author: 'Acme Corp',
			restNamespace: 'dp/v1',
			blockName: 'dp/flowchart',
			dryRun: false,
		} );

		assert.equal( result.target.restNamespace, 'dp/v1' );
		assert.equal( result.target.blockName, 'dp/flowchart' );

		const uiContent = await readFile( join( root, 'mock-ui.js' ), 'utf8' );
		assert.match( uiContent, /dp-settings/ );
		assert.match( uiContent, /dpAdminBootstrap/ );

		const controllerContent = await readFile(
			join(
				root,
				'src/backend/Apps/HelloWorld/Rest/HelloWorldController.php'
			),
			'utf8'
		);
		assert.match( controllerContent, /dp\/v1/ );

		const blockJsonContent = await readFile(
			join( root, 'src/frontend/apps/hello-world/block.json' ),
			'utf8'
		);
		assert.match( blockJsonContent, /dp\/flowchart/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffoldPlugin handles multi-entry PSR-4 common namespace, dev REST route, vendor categories, and languages renaming', async () => {
	const root = await createFixture();
	try {
		// Mock composer.json with multiple sub-namespaces sharing a common prefix
		const composerJsonPath = join( root, 'composer.json' );
		const composerData = {
			name: 'orig-vendor/orig-plugin',
			autoload: {
				'psr-4': {
					'OrigPrefix\\Plugin\\Framework\\': 'src/framework/',
					'OrigPrefix\\Plugin\\Backend\\': 'src/backend/',
					'OrigPrefix\\Plugin\\Development\\': 'src/development/',
				},
			},
		};
		await writeFile( composerJsonPath, JSON.stringify( composerData, null, 2 ) );

		// Mock PHP file using backend sub-namespace and category
		await mkdir( join( root, 'src/backend/Apps/HelloWorld/Rest' ), { recursive: true } );
		await writeFile(
			join(
				root,
				'src/backend/Apps/HelloWorld/Rest/HelloWorldController.php'
			),
			"<?php\nclass HelloWorldController {\n  protected $namespace = 'orig-vendor/v1';\n}\n"
		);
		await writeFile(
			join( root, 'src/backend/TestService.php' ),
			`<?php
namespace OrigPrefix\\Plugin\\Backend;

class TestService {
	public const CATEGORY = 'orig-vendor';
	public const DEV_ROUTE = 'orig-vendor-dev/v1';
}
`
		);

		// Mock languages directory files
		await mkdir( join( root, 'languages' ), { recursive: true } );
		await writeFile(
			join( root, 'languages/sample-wordpress-plugin.pot' ),
			'# POT template for sample-wordpress-plugin\n'
		);
		await writeFile(
			join( root, 'languages/sample-wordpress-plugin-en_US.po' ),
			'# PO for sample-wordpress-plugin\n'
		);

		const detected = await detectCurrentPlugin( root );
		assert.equal( detected.namespace, 'OrigPrefix\\Plugin' );

		const result = await scaffoldPlugin( {
			root,
			name: 'Modern Tool',
			slug: 'modern-tool',
			namespace: 'NewPrefix\\Tool',
			restNamespace: 'modern-tool/v1',
			blockName: 'modern-tool/widget',
			dryRun: false,
		} );

		assert.equal( result.target.namespace, 'NewPrefix\\Tool' );

		// Verify composer.json updated with proper sub-namespaces
		const updatedComposer = JSON.parse(
			await readFile( composerJsonPath, 'utf8' )
		);
		assert.ok( updatedComposer.autoload['psr-4']['NewPrefix\\Tool\\Framework\\'] );
		assert.ok( updatedComposer.autoload['psr-4']['NewPrefix\\Tool\\Backend\\'] );

		// Verify PHP file updated
		const updatedPhp = await readFile(
			join( root, 'src/backend/TestService.php' ),
			'utf8'
		);
		assert.match( updatedPhp, /namespace NewPrefix\\Tool\\Backend;/ );
		assert.match( updatedPhp, /public const CATEGORY = 'modern-tool';/ );
		assert.match( updatedPhp, /public const DEV_ROUTE = 'modern-tool-dev\/v1';/ );

		// Verify language files renamed
		const potContent = await readFile(
			join( root, 'languages/modern-tool.pot' ),
			'utf8'
		);
		assert.match( potContent, /modern-tool/ );
		const poContent = await readFile(
			join( root, 'languages/modern-tool-en_US.po' ),
			'utf8'
		);
		assert.match( poContent, /modern-tool/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );
