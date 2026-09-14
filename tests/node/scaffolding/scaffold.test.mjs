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
				'--description',
				'Dry run custom description',
				'--greeting',
				'Hello from Dry Run!',
				'--dry-run',
			],
			{ cwd: projectRoot, encoding: 'utf8' }
		);

		assert.equal( cli.status, 0, cli.stderr );
		assert.match( cli.stdout, /DRY RUN/ );
		assert.match( cli.stdout, /Description:\s+Dry run custom description/ );
		assert.match( cli.stdout, /Greeting:\s+Hello from Dry Run!/ );
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

test( 'scaffoldPlugin transforms legacy boilerplate leftovers, Bruno REST contract, and WP-CLI commands', async () => {
	const root = await createFixture();
	try {
		// Mock Bruno collection file
		await mkdir( join( root, 'tests/bruno' ), { recursive: true } );
		await writeFile(
			join( root, 'tests/bruno/bruno.json' ),
			JSON.stringify(
				{
					version: '1',
					name: 'WordPress AI Boilerplate REST Contract',
					type: 'collection',
				},
				null,
				2
			)
		);

		// Mock backend service provider registering WP-CLI command
		await mkdir( join( root, 'src/backend' ), { recursive: true } );
		await writeFile(
			join( root, 'src/backend/BackendServiceProvider.php' ),
			`<?php
namespace Acme\\Test;
class BackendServiceProvider {
	public function boot(): void {
		WP_CLI::add_command( 'ai-ready', PluginCliCommand::class );
	}
}
`
		);

		// Mock frontend interactive component and legacy menu titles
		await mkdir( join( root, 'src/frontend' ), { recursive: true } );
		await writeFile(
			join( root, 'src/frontend/test-interactive.php' ),
			`<?php
add_menu_page( __( 'AI Boilerplate', 'textdomain' ), __( 'AI Boilerplate', 'textdomain' ) );
add_submenu_page( 'slug', __( 'Boilerplate Settings', 'textdomain' ) );
$store = 'airwp/hello-world';
$bootstrap = 'airwpSettingsBootstrap';
`
		);

		const result = await scaffoldPlugin( {
			root,
			name: 'Falcon Analytics',
			slug: 'falcon-analytics',
			namespace: 'Falcon\\Analytics',
			restNamespace: 'falcon/v1',
			blockName: 'falcon/counter',
			cliCommand: 'falcon',
			dryRun: false,
		} );

		assert.equal( result.target.cliCommand, 'falcon' );

		// Verify bruno.json transformed
		const brunoContent = JSON.parse(
			await readFile( join( root, 'tests/bruno/bruno.json' ), 'utf8' )
		);
		assert.equal(
			brunoContent.name,
			'Falcon Analytics REST Contract'
		);

		// Verify WP-CLI command transformed
		const backendPhp = await readFile(
			join( root, 'src/backend/BackendServiceProvider.php' ),
			'utf8'
		);
		assert.match( backendPhp, /WP_CLI::add_command\(\s*'falcon'/ );

		// Verify legacy frontend leftovers transformed
		const frontendPhp = await readFile(
			join( root, 'src/frontend/test-interactive.php' ),
			'utf8'
		);
		assert.match( frontendPhp, /Falcon Analytics/ );
		assert.match( frontendPhp, /Falcon Analytics Settings/ );
		assert.match( frontendPhp, /falcon\/counter/ );
		assert.match( frontendPhp, /falconAnalyticsAdminBootstrap/ );
		assert.doesNotMatch( frontendPhp, /AI Boilerplate/ );
		assert.doesNotMatch( frontendPhp, /Boilerplate Settings/ );
		assert.doesNotMatch( frontendPhp, /airwp\/hello-world/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffoldPlugin personalizes descriptions, greetings, block metadata, pattern copy, and readme text', async () => {
	const root = await createFixture();
	try {
		// Mock settings description ValueObject
		await mkdir( join( root, 'src/backend/Apps/Settings/Domain/ValueObject' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/backend/Apps/Settings/Domain/ValueObject/Description.php' ),
			`<?php
namespace Acme\\Test;
class Description {
	public static function default(): self {
		return new self( 'A modern WordPress plugin powered by AI workflows.' );
	}
}
`
		);

		// Mock greeting Domain ValueObject
		await mkdir( join( root, 'src/backend/Apps/HelloWorld/Domain' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/backend/Apps/HelloWorld/Domain/HelloWorldGreeting.php' ),
			`<?php
namespace Acme\\Test;
class HelloWorldGreeting {
	public static function default(): self {
		return new self( 'Hello from WP AI Ready Plugin Boilerplate!' );
	}
}
`
		);

		// Mock block.json
		await mkdir( join( root, 'src/frontend/apps/hello-world' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/frontend/apps/hello-world/block.json' ),
			JSON.stringify(
				{
					name: 'wpaibp/hello-world',
					title: 'Hello World',
					description:
						'A modern interactive starter block for WP AI Ready Plugin Boilerplate.',
					keywords: [ 'hello', 'world', 'ai', 'interactivity', 'boilerplate' ],
					attributes: {
						greeting: {
							type: 'string',
							default: 'Hello from WP AI Ready Plugin Boilerplate!',
						},
					},
				},
				null,
				2
			)
		);

		// Mock frontend save.tsx
		await writeFile(
			join( root, 'src/frontend/apps/hello-world/save.tsx' ),
			`import { __ } from '@wordpress/i18n';
export default function Save() {
	return (
		<p>{ __( 'Powered by WP AI Ready Plugin Boilerplate.', 'textdomain' ) }</p>
	);
}
`
		);

		// Mock patterns
		await mkdir( join( root, 'src/frontend/patterns' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/frontend/patterns/card-feature.php' ),
			`<?php
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<h3 class="wp-block-heading"><?php esc_html_e( 'Autonomous AI Capabilities', 'textdomain' ); ?></h3>
<p><?php esc_html_e( 'Explore seamless integrations between Gutenberg blocks, WordPress REST API, and AI agent workflows.', 'textdomain' ); ?></p>
`
		);
		await writeFile(
			join( root, 'src/frontend/patterns/interactive-showcase.php' ),
			`<?php
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<!-- Description: A modern interactive showcase featuring the Hello World block. -->
`
		);

		// Mock readme.txt
		await writeFile(
			join( root, 'readme.txt' ),
			`=== WP AI Ready Plugin Boilerplate ===
Tags: boilerplate, enterprise, modern, ddd, react

WP AI Ready Plugin Boilerplate provides a modern, robust architecture for WordPress plugin development. It includes a tripartite app-centric domain model (Framework, Backend, Frontend Bridge), Gutenberg Block API v3 integration with Interactivity API, React 18 admin settings interface built with the WordPress Design System (WPDS), contract-first REST API endpoints, and a comprehensive five-tier testing pyramid.

== Frequently Asked Questions ==
= Does this require PHP 8.3? =
Yes, this boilerplate requires PHP 8.3 or greater.

== Changelog ==
= 1.0.0 =
* Initial enterprise boilerplate release.
`
		);

		const result = await scaffoldPlugin( {
			root,
			name: 'Falcon Forms',
			slug: 'falcon-forms',
			namespace: 'Falcon\\Forms',
			description: 'A powerful drag and drop form builder for WordPress.',
			greeting: 'Welcome to Falcon Forms!',
			blockTitle: 'Form Embed',
			blockDescription: 'Interactive embed block for Falcon Forms.',
			cliCommand: 'falcon-forms',
			dryRun: false,
		} );

		assert.equal(
			result.target.description,
			'A powerful drag and drop form builder for WordPress.'
		);
		assert.equal( result.target.greeting, 'Welcome to Falcon Forms!' );
		assert.equal( result.target.blockTitle, 'Form Embed' );
		assert.equal(
			result.target.blockDescription,
			'Interactive embed block for Falcon Forms.'
		);

		// 1. Verify description replaced in PHP ValueObject
		const descPhp = await readFile(
			join( root, 'src/backend/Apps/Settings/Domain/ValueObject/Description.php' ),
			'utf8'
		);
		assert.match(
			descPhp,
			/A powerful drag and drop form builder for WordPress\./
		);
		assert.doesNotMatch(
			descPhp,
			/A modern WordPress plugin powered by AI workflows\./
		);

		// 2. Verify greeting replaced in PHP ValueObject
		const greetingPhp = await readFile(
			join( root, 'src/backend/Apps/HelloWorld/Domain/HelloWorldGreeting.php' ),
			'utf8'
		);
		assert.match( greetingPhp, /Welcome to Falcon Forms!/ );
		assert.doesNotMatch(
			greetingPhp,
			/Hello from WP AI Ready Plugin Boilerplate!/
		);

		// 3. Verify save.tsx "Powered by" text replaced
		const saveTsx = await readFile(
			join( root, 'src/frontend/apps/hello-world/save.tsx' ),
			'utf8'
		);
		assert.match( saveTsx, /Powered by Falcon Forms\./ );
		assert.doesNotMatch(
			saveTsx,
			/Powered by WP AI Ready Plugin Boilerplate\./
		);

		// 4. Verify block.json replaced
		const blockJson = JSON.parse(
			await readFile(
				join( root, 'src/frontend/apps/hello-world/block.json' ),
				'utf8'
			)
		);
		assert.equal(
			blockJson.description,
			'Interactive embed block for Falcon Forms.'
		);
		assert.equal(
			blockJson.attributes.greeting.default,
			'Welcome to Falcon Forms!'
		);
		assert.ok( blockJson.keywords.includes( 'falcon-forms' ) );
		assert.ok( ! blockJson.keywords.includes( 'boilerplate' ) );

		// 5. Verify patterns replaced
		const cardPhp = await readFile(
			join( root, 'src/frontend/patterns/card-feature.php' ),
			'utf8'
		);
		assert.match( cardPhp, /Falcon Forms Capabilities/ );
		assert.doesNotMatch( cardPhp, /Autonomous AI Capabilities/ );
		assert.match( cardPhp, /and Falcon Forms workflows\./ );
		assert.doesNotMatch( cardPhp, /and AI agent workflows\./ );

		const showcasePhp = await readFile(
			join( root, 'src/frontend/patterns/interactive-showcase.php' ),
			'utf8'
		);
		assert.match(
			showcasePhp,
			/A modern interactive showcase featuring the Form Embed block\./
		);

		// 6. Verify readme.txt replaced
		const readme = await readFile( join( root, 'readme.txt' ), 'utf8' );
		assert.match(
			readme,
			/Tags: falcon-forms, enterprise, modern, ddd, react/
		);
		assert.doesNotMatch( readme, /Tags: boilerplate/ );
		assert.match(
			readme,
			/Falcon Forms provides a modern, robust architecture/
		);
		assert.doesNotMatch(
			readme,
			/WP AI Ready Plugin Boilerplate provides/
		);
		assert.match(
			readme,
			/Yes, this plugin requires PHP 8\.3 or greater\./
		);
		assert.doesNotMatch(
			readme,
			/Yes, this boilerplate requires PHP 8\.3/
		);
		assert.match( readme, /\* Initial release of Falcon Forms\./ );
		assert.doesNotMatch(
			readme,
			/\* Initial enterprise boilerplate release\./
		);
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffoldPlugin generates intelligent personalized defaults when description and greeting are omitted', async () => {
	const root = await createFixture();
	try {
		await mkdir( join( root, 'src/backend/Apps/Settings/Domain/ValueObject' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/backend/Apps/Settings/Domain/ValueObject/Description.php' ),
			`<?php
class Description {
	public static function default(): self {
		return new self( 'A modern WordPress plugin powered by AI workflows.' );
	}
}
`
		);

		await mkdir( join( root, 'src/backend/Apps/HelloWorld/Domain' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/backend/Apps/HelloWorld/Domain/HelloWorldGreeting.php' ),
			`<?php
class HelloWorldGreeting {
	public static function default(): self {
		return new self( 'Hello from WP AI Ready Plugin Boilerplate!' );
	}
}
`
		);

		const result = await scaffoldPlugin( {
			root,
			name: 'Smart Optimizer',
			slug: 'smart-optimizer',
			namespace: 'Smart\\Optimizer',
			dryRun: false,
		} );

		assert.equal(
			result.target.description,
			'A modern WordPress plugin for Smart Optimizer.'
		);
		assert.equal(
			result.target.greeting,
			'Hello from Smart Optimizer!'
		);
		assert.equal(
			result.target.blockDescription,
			'A modern interactive block for Smart Optimizer.'
		);

		const greetingPhp = await readFile(
			join( root, 'src/backend/Apps/HelloWorld/Domain/HelloWorldGreeting.php' ),
			'utf8'
		);
		assert.match( greetingPhp, /Hello from Smart Optimizer!/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffoldPlugin cleans CHANGELOG.md, readme.txt, ADRs, and implementation logs by default', async () => {
	const root = await createFixture();
	try {
		// 1. Setup ADR directory with 0001, 0002, and index README.md
		const adrDir = join( root, 'docs/adr' );
		await mkdir( adrDir, { recursive: true } );
		await writeFile(
			join( adrDir, '0001-record-architecture-decisions.md' ),
			`# ADR-0001: Record architecture decisions\n\n- **Status:** accepted\n- **Date:** 2026-09-08\n\n## Context\nSeed decision\n\n## Decision\nUse ADRs\n\n## Consequences\nPositive\n\n## Architectural Constraints\nNone\n\n## Verification & Fitness Functions\nvalidate-adr.mjs\n\n## Reconsider When\nNever\n`,
			'utf8'
		);
		await writeFile(
			join( adrDir, '0002-boilerplate-feature.md' ),
			`# ADR-0002: Boilerplate Feature\n\n- **Status:** accepted\n`,
			'utf8'
		);
		await writeFile(
			join( adrDir, 'README.md' ),
			`# Architecture Decision Records\n\n## Architectural Decision Log\n\n| Number | Title | Status | Date | Supersedes / Superseded by |\n| :---: | :--- | :---: | :---: | :--- |\n| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-09-08 | — |\n| [ADR-0002](0002-boilerplate-feature.md) | Boilerplate Feature | Accepted | 2026-09-08 | — |\n\n---\n`,
			'utf8'
		);

		// 2. Setup implementation logs
		const implDir = join( root, 'docs/implementation-logs' );
		await mkdir( implDir, { recursive: true } );
		await writeFile(
			join( implDir, '2026-09-09-phase-10-ci.md' ),
			'# Phase 10 Log',
			'utf8'
		);

		// 3. Setup legacy decision log
		await writeFile(
			join( root, 'docs/decision-log.md' ),
			'# Legacy Log',
			'utf8'
		);

		// 4. Setup MANIFEST.md
		await writeFile(
			join( root, 'MANIFEST.md' ),
			`# Manifest\n\n| File | Purpose | Layer |\n|---|---|---|\n| \`sample-wordpress-plugin.php\` | Main | Bootstrap |\n| \`docs/adr/0002-boilerplate-feature.md\` | Old ADR | Docs |\n| \`docs/implementation-logs/2026-09-09-phase-10-ci.md\` | Old Log | Docs |\n`,
			'utf8'
		);

		const result = await scaffoldPlugin( {
			root,
			name: 'Modern Forms',
			slug: 'modern-forms',
			namespace: 'Modern\\Forms',
			dryRun: false,
		} );

		assert.equal( result.cleanedAdrsCount, 1 );
		assert.equal( result.cleanedImplementationLogsCount, 1 );
		assert.ok( result.deletedCount >= 3 );

		// Verify CHANGELOG.md reset
		const changelog = await readFile( join( root, 'CHANGELOG.md' ), 'utf8' );
		assert.match( changelog, /# Changelog/ );
		assert.match( changelog, /## \[Unreleased\]/ );
		assert.match( changelog, /## \[1\.0\.0\]/ );
		assert.match( changelog, /- Initial release of Modern Forms\./ );
		assert.doesNotMatch( changelog, /sample-plugin/ );

		// Verify readme.txt changelog reset
		const readme = await readFile( join( root, 'readme.txt' ), 'utf8' );
		assert.match( readme, /== Changelog ==\s*=\s*1\.0\.0\s*=\s*\* Initial release of Modern Forms\./ );

		// Verify ADR-0001 retained, ADR-0002 deleted
		const adr1 = await readFile(
			join( adrDir, '0001-record-architecture-decisions.md' ),
			'utf8'
		);
		assert.match( adr1, /ADR-0001: Record architecture decisions/ );
		assert.rejects( async () => {
			await readFile( join( adrDir, '0002-boilerplate-feature.md' ), 'utf8' );
		} );

		// Verify docs/adr/README.md table has only ADR-0001
		const adrReadme = await readFile( join( adrDir, 'README.md' ), 'utf8' );
		assert.match( adrReadme, /\[ADR-0001\]\(0001-record-architecture-decisions\.md\)/ );
		assert.doesNotMatch( adrReadme, /ADR-0002/ );

		// Verify implementation logs pruned and .gitkeep exists
		assert.rejects( async () => {
			await readFile( join( implDir, '2026-09-09-phase-10-ci.md' ), 'utf8' );
		} );
		const gitkeep = await readFile( join( implDir, '.gitkeep' ), 'utf8' );
		assert.equal( gitkeep, '' );

		// Verify legacy decision log deleted
		assert.rejects( async () => {
			await readFile( join( root, 'docs/decision-log.md' ), 'utf8' );
		} );

		// Verify MANIFEST.md updated: renamed sample-wordpress-plugin.php to modern-forms.php, removed deleted lines
		const manifest = await readFile( join( root, 'MANIFEST.md' ), 'utf8' );
		assert.match( manifest, /`modern-forms\.php`/ );
		assert.doesNotMatch( manifest, /0002-boilerplate-feature\.md/ );
		assert.doesNotMatch( manifest, /2026-09-09-phase-10-ci\.md/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffoldPlugin resets versioning to 1.0.0 across all manifests, constants, and block.json', async () => {
	const root = await createFixture();
	try {
		// Add Plugin.php and block.json with higher version 2.4.0
		await mkdir( join( root, 'src/framework/Kernel' ), { recursive: true } );
		await writeFile(
			join( root, 'src/framework/Kernel/Plugin.php' ),
			`<?php
namespace Acme\\Test;
class Plugin {
	public const VERSION = '2.4.0';
}
`,
			'utf8'
		);

		await mkdir( join( root, 'src/frontend/apps/hello-world' ), {
			recursive: true,
		} );
		await writeFile(
			join( root, 'src/frontend/apps/hello-world/block.json' ),
			JSON.stringify(
				{
					name: 'acme/hello-world',
					version: '2.4.0',
					title: 'Hello World',
				},
				null,
				2
			) + '\n',
			'utf8'
		);

		const result = await scaffoldPlugin( {
			root,
			name: 'Version Test Plugin',
			slug: 'version-test-plugin',
			namespace: 'Version\\TestPlugin',
			prefix: 'VTP_',
			dryRun: false,
		} );

		assert.equal( result.target.version, '1.0.0' );

		// package.json
		const pkg = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( pkg.version, '1.0.0' );

		// package-lock.json
		const lock = JSON.parse(
			await readFile( join( root, 'package-lock.json' ), 'utf8' )
		);
		assert.equal( lock.version, '1.0.0' );

		// composer.json
		const comp = JSON.parse(
			await readFile( join( root, 'composer.json' ), 'utf8' )
		);
		assert.equal( comp.version, '1.0.0' );

		// Main PHP file
		const mainPhp = await readFile(
			join( root, 'version-test-plugin.php' ),
			'utf8'
		);
		assert.match( mainPhp, /\*\s*Version:\s*1\.0\.0/ );
		assert.match( mainPhp, /define\(\s*'VTP_VERSION',\s*'1\.0\.0'\s*\);/ );

		// Plugin.php
		const pluginClass = await readFile(
			join( root, 'src/framework/Kernel/Plugin.php' ),
			'utf8'
		);
		assert.match( pluginClass, /public\s+const\s+VERSION\s*=\s*'1\.0\.0';/ );

		// block.json
		const block = JSON.parse(
			await readFile(
				join( root, 'src/frontend/apps/hello-world/block.json' ),
				'utf8'
			)
		);
		assert.equal( block.version, '1.0.0' );

		// readme.txt
		const readme = await readFile( join( root, 'readme.txt' ), 'utf8' );
		assert.match( readme, /Stable\s+tag:\s*1\.0\.0/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffold CLI respects --no-clean-history, --no-reset-version, and --target-version', async () => {
	const root = await createFixture();
	try {
		const originalChangelog = await readFile(
			join( root, 'CHANGELOG.md' ),
			'utf8'
		);
		const originalPackage = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);

		const cli = spawnSync(
			process.execPath,
			[
				cliPath,
				'--root',
				root,
				'--name',
				'Flag Test Plugin',
				'--slug',
				'flag-test-plugin',
				'--no-clean-history',
				'--no-reset-version',
			],
			{ cwd: projectRoot, encoding: 'utf8' }
		);

		assert.equal( cli.status, 0, cli.stderr );
		assert.match( cli.stdout, /History Clean:\s+No \(Preserved\)/ );

		// Verify changelog was not reset to 1.0.0 initial release
		const changelogAfter = await readFile(
			join( root, 'CHANGELOG.md' ),
			'utf8'
		);
		assert.doesNotMatch(
			changelogAfter,
			/Initial release of Flag Test Plugin/
		);

		// Verify package version was not reset to 1.0.0
		const packageAfter = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( packageAfter.version, originalPackage.version );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'scaffoldPlugin handles single-token namespace (WPAIBP), prefix constants, and PHP/JS identifiers without syntax errors', async () => {
	const root = await createFixture();
	try {
		// Mock PHP files with constants, namespace declaration, and uninstall function
		const mainPhpPath = join( root, 'sample-wordpress-plugin.php' );
		await writeFile(
			mainPhpPath,
			`<?php
/**
 * Plugin Name: Sample WordPress Plugin
 * Version: 1.2.3
 * Text Domain: sample-wordpress-plugin
 * @package WPAIBP
 */

namespace WPAIBP\\Framework\\Kernel;

use WPAIBP\\Framework\\Kernel\\Plugin;

define( 'SWP_PLUGIN_FILE', __FILE__ );
define( 'SWP_VERSION', '1.2.3' );
`
		);

		const uninstallPath = join( root, 'uninstall.php' );
		await writeFile(
			uninstallPath,
			`<?php
function swp_uninstall_plugin(): void {
	delete_option( 'swp_settings' );
}
`
		);

		const bootstrapPath = join( root, 'tests/phpunit/bootstrap.php' );
		await mkdir( dirname( bootstrapPath ), { recursive: true } );
		await writeFile(
			bootstrapPath,
			`<?php
function _swp_manually_load_plugin() {
	require_once 'sample-wordpress-plugin.php';
}
`
		);

		const tsTypePath = join( root, 'src/frontend/shared/types/index.ts' );
		await mkdir( dirname( tsTypePath ), { recursive: true } );
		await writeFile(
			tsTypePath,
			`export interface Window {
	swpAdminBootstrap?: SwpBootstrapData;
}
`
		);

		const composerPath = join( root, 'composer.json' );
		await writeFile(
			composerPath,
			JSON.stringify(
				{
					name: 'wordpress-ai/sample-wordpress-plugin',
					autoload: {
						'psr-4': {
							'WPAIBP\\Framework\\': 'src/framework/',
							'WPAIBP\\Backend\\': 'src/backend/',
							'WPAIBP\\Development\\': 'src/development/',
							'WPAIBP\\Frontend\\': 'src/frontend/Bridge/',
						},
					},
				},
				null,
				2
			)
		);

		const result = await scaffoldPlugin( {
			root,
			name: 'AI Flow Automator',
			slug: 'ai-flow-automator',
			namespace: 'FlowCraft\\AIFlowAutomator',
			prefix: 'AFA_',
			restNamespace: 'ai-flow/v1',
			blockName: 'ai-flow/flow-canvas',
			composerName: 'flowcraft/ai-flow-automator',
			cliCommand: 'ai-flow',
			dryRun: false,
		} );

		assert.equal( result.target.namespace, 'FlowCraft\\AIFlowAutomator' );

		// 1. Verify main PHP file has single backslashes in PHP code and correct prefix constants
		const mainPhpAfter = await readFile(
			join( root, 'ai-flow-automator.php' ),
			'utf8'
		);
		assert.match(
			mainPhpAfter,
			/namespace FlowCraft\\AIFlowAutomator\\Framework\\Kernel;/
		);
		assert.doesNotMatch(
			mainPhpAfter,
			/namespace FlowCraft\\\\AIFlowAutomator/
		);
		assert.match(
			mainPhpAfter,
			/define\(\s*'AFA_PLUGIN_FILE',\s*__FILE__\s*\);/
		);
		assert.match(
			mainPhpAfter,
			/define\(\s*'AFA_VERSION',\s*'1\.0\.0'\s*\);/
		);
		assert.doesNotMatch( mainPhpAfter, /FlowCraft.*VERSION/ );

		// 2. Verify uninstall.php has valid PHP function name without hyphens
		const uninstallAfter = await readFile(
			join( root, 'uninstall.php' ),
			'utf8'
		);
		assert.match(
			uninstallAfter,
			/function afa_uninstall_plugin\(\): void/
		);
		assert.doesNotMatch( uninstallAfter, /function ai-flow/ );
		assert.match( uninstallAfter, /delete_option\(\s*'afa_settings'\s*\);/ );

		// 3. Verify tests bootstrap has valid PHP function name
		const bootstrapAfter = await readFile( bootstrapPath, 'utf8' );
		assert.match(
			bootstrapAfter,
			/function _afa_manually_load_plugin\(\)/
		);
		assert.doesNotMatch( bootstrapAfter, /function _ai-flow/ );

		// 4. Verify TypeScript has valid JS property name
		const tsAfter = await readFile( tsTypePath, 'utf8' );
		assert.match( tsAfter, /afaAdminBootstrap\?:/ );
		assert.doesNotMatch( tsAfter, /ai-flowAdminBootstrap/ );

		// 5. Verify composer.json has double backslashes in JSON
		const composerAfter = JSON.parse(
			await readFile( composerPath, 'utf8' )
		);
		assert.ok(
			composerAfter.autoload[ 'psr-4' ][
				'FlowCraft\\AIFlowAutomator\\Framework\\'
			]
		);
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );
