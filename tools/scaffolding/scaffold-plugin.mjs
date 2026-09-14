#!/usr/bin/env node
import process from 'node:process';
import { parseArgs } from 'node:util';
import readline from 'node:readline/promises';
import {
	detectCurrentPlugin,
	scaffoldPlugin,
	slugify,
	toPascalCase,
} from './scaffold-engine.mjs';

const HELP = `
Usage: npm run scaffold -- [options]
       npm run rename -- [options]

Rebrands and adapts this WordPress AI Boilerplate into a new, custom-tailored plugin.
Atomically updates plugin slug, PHP namespace, constant prefix, Composer & npm packages,
Gutenberg block names, REST endpoints, text domain, and file names.
Resets repository history, ADRs, audit logs, and versioning baseline to 1.0.0 by default.

Options:
  --name <string>             New plugin display name (e.g. "Mermaid Diagrams")
  --slug <string>             New plugin slug (e.g. "mermaid-diagrams")
  --namespace <string>        New PHP namespace (e.g. "WebFalcon\\MermaidDiagrams")
  --prefix <string>           Constant prefix (e.g. "MDM_")
  --author <string>           Author or vendor name (e.g. "WebFalcon")
  --description <string>      Plugin description text
  --greeting <string>         Default greeting message for REST & block
  --block-title <string>      Primary block title (e.g. "Diagram Editor")
  --block-description <string> Primary block description
  --text-domain <string>      WordPress translation text domain (defaults to slug)
  --rest-namespace <string>   REST API namespace (e.g. "mdm/v1")
  --block-name <string>       Gutenberg block identifier (e.g. "mdm/diagram")
  --composer-name <string>    Composer package name (e.g. "vendor/slug")
  --cli-command <string>      WP-CLI command root (defaults to slug without -plugin)
  --clean-history             Clean boilerplate changelog, ADRs, and audit logs (default: true)
  --no-clean-history          Preserve existing changelog, ADRs, and audit logs
  --keep-history              Alias for --no-clean-history
  --reset-version             Reset plugin version baseline to 1.0.0 (default: true)
  --no-reset-version          Retain existing version numbers
  --target-version <string>   Target version baseline when resetting (default: "1.0.0")
  --root <path>               Project root directory (defaults to current working directory)
  --dry-run                   Preview all changes without modifying any files
  --interactive               Prompt for all values interactively
  --help                      Show this help message
`;

const { values } = parseArgs( {
	options: {
		name: { type: 'string' },
		slug: { type: 'string' },
		namespace: { type: 'string' },
		prefix: { type: 'string' },
		author: { type: 'string' },
		description: { type: 'string' },
		greeting: { type: 'string' },
		'block-description': { type: 'string' },
		'block-title': { type: 'string' },
		'text-domain': { type: 'string' },
		'rest-namespace': { type: 'string' },
		'block-name': { type: 'string' },
		'composer-name': { type: 'string' },
		'cli-command': { type: 'string' },
		'clean-history': { type: 'boolean', default: true },
		'no-clean-history': { type: 'boolean', default: false },
		'keep-history': { type: 'boolean', default: false },
		'reset-version': { type: 'boolean', default: true },
		'no-reset-version': { type: 'boolean', default: false },
		'target-version': { type: 'string', default: '1.0.0' },
		root: { type: 'string', default: process.cwd() },
		'dry-run': { type: 'boolean', default: false },
		interactive: { type: 'boolean', default: false },
		help: { type: 'boolean', default: false },
	},
	allowPositionals: false,
	strict: true,
} );

if ( values.help ) {
	console.log( HELP.trim() );
	process.exit( 0 );
}

async function main() {
	const root = values.root;
	const current = await detectCurrentPlugin( root );

	let name = values.name;
	let slug = values.slug;
	let namespace = values.namespace;
	let prefix = values.prefix;
	let author = values.author;
	let description = values.description;
	let greeting = values.greeting;
	const blockTitle = values[ 'block-title' ];
	const blockDescription = values[ 'block-description' ];
	const textDomain = values[ 'text-domain' ];
	const restNamespace = values[ 'rest-namespace' ];
	const blockName = values[ 'block-name' ];
	const composerName = values[ 'composer-name' ];
	const cliCommand = values[ 'cli-command' ];
	const shouldCleanHistory =
		! values[ 'no-clean-history' ] &&
		! values[ 'keep-history' ] &&
		values[ 'clean-history' ] !== false;
	const shouldResetVersion =
		! values[ 'no-reset-version' ] && values[ 'reset-version' ] !== false;
	const targetVersion = values[ 'target-version' ] || '1.0.0';

	const shouldPrompt =
		values.interactive || ( ! name && process.stdin.isTTY );

	if ( shouldPrompt ) {
		const rl = readline.createInterface( {
			input: process.stdin,
			output: process.stdout,
		} );

		console.log(
			'\n======================================================'
		);
		console.log( '  WordPress AI Plugin Scaffolding & Rebranding CLI    ' );
		console.log(
			'======================================================\n'
		);
		console.log(
			`Current plugin: "${ current.name }" (${ current.slug })\n`
		);

		name =
			( await rl.question(
				`Plugin Display Name [${ name || 'Custom WordPress Plugin' }]: `
			) ) ||
			name ||
			'Custom WordPress Plugin';
		const defaultSlug = slugify( name );
		slug =
			( await rl.question(
				`Plugin Slug [${ slug || defaultSlug }]: `
			) ) ||
			slug ||
			defaultSlug;

		author =
			( await rl.question(
				`Author / Vendor [${ author || 'MyVendor' }]: `
			) ) ||
			author ||
			'MyVendor';
		const defaultNamespace = `${ toPascalCase( author ) }\\${ toPascalCase(
			slug
		) }`;
		namespace =
			( await rl.question(
				`PHP Namespace [${ namespace || defaultNamespace }]: `
			) ) ||
			namespace ||
			defaultNamespace;

		const defaultPrefix = `${ slug
			.replace( /[^a-zA-Z0-9]/g, '_' )
			.toUpperCase() }_`;
		prefix =
			( await rl.question(
				`Constant Prefix [${ prefix || defaultPrefix }]: `
			) ) ||
			prefix ||
			defaultPrefix;

		const defaultDescription = `A modern WordPress plugin for ${ name }.`;
		description =
			( await rl.question(
				`Plugin Description [${ description || defaultDescription }]: `
			) ) ||
			description ||
			defaultDescription;

		const defaultGreeting = `Hello from ${ name }!`;
		greeting =
			( await rl.question(
				`Default Greeting [${ greeting || defaultGreeting }]: `
			) ) ||
			greeting ||
			defaultGreeting;

		rl.close();
	}

	if ( ! name ) {
		name = current.name;
	}
	if ( ! slug ) {
		slug = slugify( name );
	}

	console.log( '\nProcessing project transformations...' );
	if ( values[ 'dry-run' ] ) {
		console.log( '[MODE: DRY RUN — No disk modifications will occur]' );
	}

	const result = await scaffoldPlugin( {
		root,
		name,
		slug,
		namespace,
		prefix,
		textDomain,
		author,
		description,
		greeting,
		blockTitle,
		blockDescription,
		restNamespace,
		blockName,
		composerName,
		cliCommand,
		cleanHistory: shouldCleanHistory,
		resetVersion: shouldResetVersion,
		targetVersion,
		dryRun: values[ 'dry-run' ],
	} );

	console.log( '\n======================================================' );
	console.log( '  Scaffolding Summary:' );
	console.log( '======================================================' );
	console.log( `  Name:           ${ result.target.name }` );
	console.log( `  Slug:           ${ result.target.slug }` );
	console.log( `  Description:    ${ result.target.description }` );
	console.log( `  Greeting:       ${ result.target.greeting }` );
	console.log( `  CLI Command:    wp ${ result.target.cliCommand }` );
	console.log( `  Main PHP File:  ${ result.target.mainPhpFile }` );
	console.log( `  PHP Namespace:  ${ result.target.namespace }` );
	console.log( `  Prefix:         ${ result.target.prefix }` );
	console.log( `  REST Route:     ${ result.target.restNamespace }` );
	console.log( `  Block:          ${ result.target.blockName }` );
	console.log( `  Block Desc:     ${ result.target.blockDescription }` );
	console.log( `  Composer Name:  ${ result.target.composerName || 'N/A' }` );
	console.log( `  Author:         ${ result.target.author }` );
	console.log( '------------------------------------------------------' );
	console.log(
		`  Version:        ${ result.current.version } -> ${ result.target.version }`
	);
	console.log(
		`  History Clean:  ${
			shouldCleanHistory
				? 'Yes (Changelog reset, ADRs pruned, audit logs cleared)'
				: 'No (Preserved)'
		}`
	);
	console.log( `  Files Modified: ${ result.modifiedCount }` );
	console.log( `  Files Renamed:  ${ result.renamedCount }` );
	console.log( `  Files Deleted:  ${ result.deletedCount }` );
	if ( result.cleanedAdrsCount > 0 ) {
		console.log( `  ADRs Pruned:    ${ result.cleanedAdrsCount }` );
	}
	if ( result.cleanedImplementationLogsCount > 0 ) {
		console.log(
			`  Logs Cleared:   ${ result.cleanedImplementationLogsCount }`
		);
	}

	if ( result.renamedCount > 0 ) {
		console.log( '\nRenamed:' );
		for ( const r of result.renamedFiles ) {
			console.log( `  ${ r.from } -> ${ r.to }` );
		}
	}

	if ( result.deletedCount > 0 ) {
		console.log( '\nDeleted:' );
		for ( const d of result.deletedFiles ) {
			console.log( `  - ${ d }` );
		}
	}

	if ( values[ 'dry-run' ] ) {
		console.log(
			'\nDry run completed successfully. No files were written.'
		);
	} else {
		console.log( '\nPlugin successfully scaffolded! Recommended next steps:' );
		console.log( '  composer dump-autoload' );
		console.log( '  npm run build' );
		console.log( '  npm run openapi:generate' );
		console.log( '  npm test\n' );
	}
}

main().catch( ( err ) => {
	console.error( `\nError during scaffolding: ${ err.message }` );
	process.exit( 1 );
} );
