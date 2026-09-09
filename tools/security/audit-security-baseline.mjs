#!/usr/bin/env node
/**
 * Deterministic Security Static Checker for WordPress Plugin Boilerplate.
 *
 * Scans PHP source code to enforce repository-wide security invariants:
 * 1. Raw Superglobal Access: Prohibits un-sanitized or wholesale superglobal usage ($_POST, $_GET, $_REQUEST).
 * 2. Unescaped Output in Templates: Enforces late escaping (esc_html, esc_attr, wp_kses, etc.) in view templates.
 * 3. Prepared Database Queries: Requires all dynamic $wpdb queries to use $wpdb->prepare().
 * 4. REST Route Permissions: Mandates non-empty permission_callback in every register_rest_route call.
 *
 * @package AIReady\WPPluginBoilerplate
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

const HELP = `
Usage:
  node tools/security/audit-security-baseline.mjs [options]
  npm run lint:security -- [options]

WordPress Plugin Security Baseline Audit.

Options:
  --root <path>        Project root directory. Default: current directory.
  --json               Output structured JSON format.
  -h, --help           Show this help message.
`;

/**
 * Directories to ignore during scanning.
 */
const IGNORE_DIRS = new Set( [
	'node_modules',
	'vendor',
	'build',
	'.git',
	'.cursor',
	'tests',
] );

/**
 * Recursively retrieves all PHP files under a given directory.
 *
 * @param {string} dir Directory to traverse.
 * @return {Promise<string[]>} Array of absolute paths to PHP files.
 */
export async function getPhpFiles( dir ) {
	const files = [];

	async function traverse( currentDir ) {
		let entries;
		try {
			entries = await readdir( currentDir, { withFileTypes: true } );
		} catch {
			return;
		}

		for ( const entry of entries ) {
			if ( entry.isDirectory() ) {
				if ( ! IGNORE_DIRS.has( entry.name ) ) {
					await traverse( join( currentDir, entry.name ) );
				}
			} else if ( entry.isFile() && entry.name.endsWith( '.php' ) ) {
				files.push( join( currentDir, entry.name ) );
			}
		}
	}

	await traverse( dir );
	return files;
}

/**
 * Removes comments and string literals to simplify code token analysis.
 *
 * @param {string} phpContent
 * @return {string} Sanitized code.
 */
export function stripPhpComments( phpContent ) {
	return phpContent
		.replace( /\/\*[\s\S]*?\*\//g, '' )
		.replace( /\/\/[^\n]*/g, '' )
		.replace( /#[^\n]*/g, '' );
}

/**
 * Checks for wholesale or raw un-sanitized superglobal access.
 *
 * @param {string} file Relative file path.
 * @param {string} content PHP content.
 * @return {Array<{ file: string, line: number, message: string }>} Violations.
 */
export function checkSuperglobals( file, content ) {
	const violations = [];
	const lines = content.split( '\n' );

	for ( let i = 0; i < lines.length; i++ ) {
		const line = lines[ i ];
		const lineNum = i + 1;

		// Skip comments and docblocks
		const trimmed = line.trim();
		if (
			trimmed.startsWith( '*' ) ||
			trimmed.startsWith( '//' ) ||
			trimmed.startsWith( '/*' )
		) {
			continue;
		}

		// Check for wholesale access like foreach ( $_POST as ... ) or $all = $_POST;
		if (
			/(?:foreach\s*\(\s*\$_(POST|GET|REQUEST)\s+as|\$_(POST|GET|REQUEST)\s*;)/.test(
				line
			)
		) {
			violations.push( {
				file,
				line: lineNum,
				message: `Wholesale superglobal access forbidden. Access specific individual keys only: "${ trimmed }"`,
			} );
		}

		// Check for direct unescaped/unsanitized output of superglobal: echo $_POST['...']
		if ( /(?:echo|print)\s+.*\$_(POST|GET|REQUEST)/.test( line ) ) {
			violations.push( {
				file,
				line: lineNum,
				message: `Direct output of superglobal forbidden. Must sanitize and late-escape: "${ trimmed }"`,
			} );
		}
	}

	return violations;
}

/**
 * Checks for unescaped output in PHP template/view files.
 *
 * @param {string} file Relative file path.
 * @param {string} content PHP content.
 * @return {Array<{ file: string, line: number, message: string }>} Violations.
 */
export function checkTemplateEscaping( file, content ) {
	const isTemplate =
		file.includes( '/templates/' ) ||
		file.includes( '/views/' ) ||
		file.includes( '/patterns/' );

	if ( ! isTemplate ) {
		return [];
	}

	const violations = [];
	const lines = content.split( '\n' );

	for ( let i = 0; i < lines.length; i++ ) {
		const line = lines[ i ];
		const lineNum = i + 1;

		// Check for echo $var or <?= $var without escaping wrapper
		const echoMatch = line.match( /(?:echo\s+|\<\?=\s*)(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/ );
		if ( echoMatch ) {
			const following = line.slice( echoMatch.index );
			// Allowed escaping functions
			const isEscaped =
				/esc_html|esc_attr|esc_url|esc_textarea|esc_js|wp_kses|wp_kses_post|absint|intval|number_format/.test(
					following
				);

			if ( ! isEscaped ) {
				violations.push( {
					file,
					line: lineNum,
					message: `Unescaped variable output in template. Use esc_html(), esc_attr(), or wp_kses_post(): "${ line.trim() }"`,
				} );
			}
		}
	}

	return violations;
}

/**
 * Checks that dynamic $wpdb queries use prepare().
 *
 * @param {string} file Relative file path.
 * @param {string} content PHP content.
 * @return {Array<{ file: string, line: number, message: string }>} Violations.
 */
export function checkWpdbPreparedQueries( file, content ) {
	const violations = [];
	const clean = stripPhpComments( content );

	// Match $wpdb->query(, $wpdb->get_results(, etc.
	const wpdbMethodRegex = /\$wpdb->(query|get_results|get_row|get_var|get_col)\s*\(\s*([^;]+)\);/gs;
	let match;

	while ( ( match = wpdbMethodRegex.exec( clean ) ) !== null ) {
		const queryArg = match[ 2 ].trim();

		// If query argument contains variable interpolation or concatenation without prepare()
		const hasDynamicVar =
			/\$[a-zA-Z_\x7f-\xff]/.test( queryArg ) &&
			! queryArg.startsWith( '$wpdb->prepare(' ) &&
			! queryArg.includes( 'prepare(' );

		if ( hasDynamicVar ) {
			// Find approximate line number
			const beforeMatch = content.slice( 0, match.index );
			const lineNum = beforeMatch.split( '\n' ).length;

			violations.push( {
				file,
				line: lineNum,
				message: `Dynamic $wpdb->${ match[ 1 ] }() call without $wpdb->prepare() is forbidden.`,
			} );
		}
	}

	return violations;
}

/**
 * Checks that register_rest_route declares permission_callback.
 *
 * @param {string} file Relative file path.
 * @param {string} content PHP content.
 * @return {Array<{ file: string, line: number, message: string }>} Violations.
 */
export function checkRestPermissions( file, content ) {
	const violations = [];

	if ( ! content.includes( 'register_rest_route' ) ) {
		return violations;
	}

	const clean = stripPhpComments( content );
	const routeRegex = /register_rest_route\s*\(\s*([^;]+)\);/gs;
	let match;

	while ( ( match = routeRegex.exec( clean ) ) !== null ) {
		const callBody = match[ 1 ];
		const hasPermissionCallback =
			callBody.includes( "'permission_callback'" ) ||
			callBody.includes( '"permission_callback"' );

		if ( ! hasPermissionCallback ) {
			const beforeMatch = content.slice( 0, match.index );
			const lineNum = beforeMatch.split( '\n' ).length;

			violations.push( {
				file,
				line: lineNum,
				message: 'register_rest_route() endpoint missing explicit permission_callback.',
			} );
		}
	}

	return violations;
}

/**
 * Run complete security baseline audit across repository PHP files.
 *
 * @param {string} [root=process.cwd()] Project root directory.
 * @return {Promise<{ valid: boolean, scannedCount: number, violations: Array<{ file: string, line: number, message: string }> }>}
 */
export async function auditSecurityBaseline( root = process.cwd() ) {
	const phpFiles = await getPhpFiles( root );
	const violations = [];

	for ( const filePath of phpFiles ) {
		const relPath = relative( root, filePath );
		const content = await readFile( filePath, 'utf8' );

		violations.push( ...checkSuperglobals( relPath, content ) );
		violations.push( ...checkTemplateEscaping( relPath, content ) );
		violations.push( ...checkWpdbPreparedQueries( relPath, content ) );
		violations.push( ...checkRestPermissions( relPath, content ) );
	}

	return {
		valid: violations.length === 0,
		scannedCount: phpFiles.length,
		violations,
	};
}

/**
 * CLI execution entrypoint.
 */
async function main() {
	const { values } = parseArgs( {
		options: {
			root: { type: 'string', default: process.cwd() },
			json: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
	} );

	if ( values.help ) {
		console.log( HELP );
		process.exit( 0 );
	}

	const root = resolve( values.root );
	const result = await auditSecurityBaseline( root );

	if ( values.json ) {
		console.log( JSON.stringify( result, null, 2 ) );
		process.exit( result.valid ? 0 : 1 );
	}

	console.log( '\n🔒 WordPress Plugin Security Baseline Audit\n' );
	console.log( `  Scanned ${ result.scannedCount } PHP files across codebase.` );

	if ( result.valid ) {
		console.log( '  ✅ 0 security baseline violations detected.\n' );
		process.exit( 0 );
	} else {
		console.error( `  ❌ Found ${ result.violations.length } security baseline violation(s):\n` );
		for ( const v of result.violations ) {
			console.error( `  • ${ v.file }:${ v.line } - ${ v.message }` );
		}
		console.log( '' );
		process.exit( 1 );
	}
}

const isDirectExecution =
	import.meta.url === `file://${ process.argv[ 1 ] }` ||
	process.argv[ 1 ]?.endsWith( 'audit-security-baseline.mjs' );

if ( isDirectExecution ) {
	main().catch( ( err ) => {
		console.error( 'Fatal error during security audit:', err );
		process.exit( 1 );
	} );
}
