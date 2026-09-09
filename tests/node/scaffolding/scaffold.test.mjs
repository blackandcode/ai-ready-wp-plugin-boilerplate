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
} from '../../../scripts/lib/scaffold-engine.mjs';

const testDirectory = dirname( fileURLToPath( import.meta.url ) );
const projectRoot = resolve( testDirectory, '../../..' );
const fixtureRoot = join(
	projectRoot,
	'tests/fixtures/versioning/sample-plugin'
);
const cliPath = join( projectRoot, 'scripts/scaffold-plugin.mjs' );

async function createFixture() {
	const directory = await mkdtemp( join( tmpdir(), 'airwp-scaffold-test-' ) );
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
		await mkdir( join( root, 'src/Rest/Controller' ), { recursive: true } );
		await writeFile(
			join( root, 'src/Rest/Controller/HelloWorldController.php' ),
			"<?php\nclass HelloWorldController {\n  protected $namespace = 'dynamic-api/v1';\n}\n"
		);
		await mkdir( join( root, 'blocks/hello-world' ), { recursive: true } );
		await writeFile(
			join( root, 'blocks/hello-world/block.json' ),
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
			join( root, 'src/Rest/Controller/HelloWorldController.php' ),
			'utf8'
		);
		assert.match( controllerContent, /dp\/v1/ );

		const blockJsonContent = await readFile(
			join( root, 'blocks/hello-world/block.json' ),
			'utf8'
		);
		assert.match( blockJsonContent, /dp\/flowchart/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );
