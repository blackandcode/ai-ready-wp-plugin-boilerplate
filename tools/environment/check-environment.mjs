#!/usr/bin/env node
import { resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { runEnvironmentCheck } from './environment-checker.mjs';

const HELP = `
Usage: npm run pre-check -- [options]
       node tools/environment/check-environment.mjs [options]

Analyzes your development environment to verify that host runtimes, Docker containers,
PHP toolchains, networking ports, and project artifacts meet all requirements.

Options:
  --root <path>    Project root directory (defaults to current working directory)
  --strict         Treat warnings and advisories as blocking failures (exit 1)
  --skip-ports     Skip checking local TCP ports 8888 and 8890
  --json           Output results as machine-readable JSON
  --no-color       Disable ANSI color formatting
  --help           Show this help message
`;

const { values } = parseArgs( {
	options: {
		root: { type: 'string', default: process.cwd() },
		strict: { type: 'boolean', default: false },
		'skip-ports': { type: 'boolean', default: false },
		json: { type: 'boolean', default: false },
		'no-color': { type: 'boolean', default: false },
		help: { type: 'boolean', default: false },
	},
	allowPositionals: false,
	strict: true,
} );

if ( values.help ) {
	console.log( HELP.trim() );
	process.exit( 0 );
}

// Check ANSI color support
const isColorSupported =
	! values[ 'no-color' ] &&
	! process.env.NO_COLOR &&
	( process.stdout.isTTY || process.env.FORCE_COLOR );

const colors = isColorSupported
	? {
			reset: '\x1b[0m',
			bold: '\x1b[1m',
			dim: '\x1b[2m',
			green: '\x1b[32m',
			yellow: '\x1b[33m',
			red: '\x1b[31m',
			cyan: '\x1b[36m',
			white: '\x1b[37m',
	  }
	: {
			reset: '',
			bold: '',
			dim: '',
			green: '',
			yellow: '',
			red: '',
			cyan: '',
			white: '',
	  };

function tag( status ) {
	if ( status === 'pass' ) {
		return `${ colors.green }${ colors.bold }[PASS]${ colors.reset }`;
	}
	if ( status === 'warn' ) {
		return `${ colors.yellow }${ colors.bold }[WARN]${ colors.reset }`;
	}
	return `${ colors.red }${ colors.bold }[FAIL]${ colors.reset }`;
}

async function main() {
	const root = resolve( values.root );

	const report = await runEnvironmentCheck( {
		root,
		strict: values.strict,
		skipPorts: values[ 'skip-ports' ],
	} );

	if ( values.json ) {
		console.log( JSON.stringify( report, null, 2 ) );
		process.exit( report.summary.isReady ? 0 : 1 );
	}

	const { platform, summary, checks, remediations } = report;

	console.log( '' );
	console.log(
		`${ colors.cyan }================================================================================${ colors.reset }`
	);
	console.log(
		`${ colors.bold }  WordPress AI Plugin Development Boilerplate — Pre-Flight Environment Check${ colors.reset }`
	);
	console.log(
		`${ colors.cyan }================================================================================${ colors.reset }`
	);
	console.log(
		`  ${ colors.dim }Platform:${ colors.reset }     ${ colors.bold }${ platform.name }${ colors.reset } (${ platform.arch })`
	);
	console.log( `  ${ colors.dim }Project Root:${ colors.reset } ${ root }` );
	console.log(
		`  ${ colors.dim }Strict Mode:${ colors.reset }  ${
			summary.strict
				? 'Enabled (warnings treated as failures)'
				: 'Disabled'
		}`
	);
	console.log(
		`${ colors.cyan }--------------------------------------------------------------------------------${ colors.reset }`
	);
	console.log( '' );

	// Group checks by category
	const categories = [
		{ id: 'runtime', title: 'Host Runtimes' },
		{ id: 'container', title: 'Container & Docker Subsystem' },
		{ id: 'php', title: 'PHP & Composer Toolchain' },
		{ id: 'filesystem', title: 'Filesystem & Environment' },
		{ id: 'networking', title: 'Network & Port Availability' },
		{ id: 'project', title: 'Project Artifacts & Configuration' },
	];

	for ( const cat of categories ) {
		const catChecks = checks.filter( ( c ) => c.category === cat.id );
		if ( catChecks.length === 0 ) {
			continue;
		}

		console.log( `${ colors.bold }# ${ cat.title }:${ colors.reset }` );
		for ( const check of catChecks ) {
			const statusTag = tag( check.status );
			const name = check.name.padEnd( 36, ' ' );
			const detail = check.found || check.message || '';
			console.log( `  ${ statusTag }  ${ name }  ${ detail }` );
		}
		console.log( '' );
	}

	console.log(
		`${ colors.cyan }--------------------------------------------------------------------------------${ colors.reset }`
	);
	console.log(
		`  ${ colors.bold }Summary:${ colors.reset } ${ colors.green }${ summary.passed } passed${ colors.reset }, ` +
			`${ summary.warnings > 0 ? colors.yellow : colors.dim }${
				summary.warnings
			} warning(s)${ colors.reset }, ` +
			`${ summary.errors > 0 ? colors.red : colors.dim }${
				summary.errors
			} error(s)${ colors.reset } ` +
			`${ colors.dim }(Total: ${ summary.total } checks)${ colors.reset }`
	);
	console.log(
		`${ colors.cyan }--------------------------------------------------------------------------------${ colors.reset }`
	);
	console.log( '' );

	// Remediation section
	const errorRemediations = remediations.filter(
		( r ) => r.status === 'fail'
	);
	const warnRemediations = remediations.filter(
		( r ) => r.status === 'warn'
	);

	if ( errorRemediations.length > 0 ) {
		console.log(
			`${ colors.red }${ colors.bold }BLOCKING ERRORS (Must be resolved before running wp-env):${ colors.reset }`
		);
		errorRemediations.forEach( ( item, idx ) => {
			console.log(
				`\n  ${ colors.bold }${ idx + 1 }. ${ item.name }${
					colors.reset
				}`
			);
			console.log(
				`     ${ colors.dim }Issue:${ colors.reset } ${ item.message }`
			);
			console.log(
				`     ${ colors.dim }Action Required:${ colors.reset }`
			);
			item.remediation
				.split( '\n' )
				.forEach( ( line ) => console.log( `       ${ line }` ) );
		} );
		console.log( '' );
	}

	if ( warnRemediations.length > 0 ) {
		console.log(
			`${ colors.yellow }${ colors.bold }ADVISORIES & RECOMMENDATIONS:${ colors.reset }`
		);
		warnRemediations.forEach( ( item, idx ) => {
			console.log(
				`\n  ${ colors.bold }${ idx + 1 }. ${ item.name }${
					colors.reset
				}`
			);
			console.log(
				`     ${ colors.dim }Details:${ colors.reset } ${ item.message }`
			);
			console.log(
				`     ${ colors.dim }Recommendation:${ colors.reset }`
			);
			item.remediation
				.split( '\n' )
				.forEach( ( line ) => console.log( `       ${ line }` ) );
		} );
		console.log( '' );
	}

	// Final status line
	console.log(
		`${ colors.cyan }================================================================================${ colors.reset }`
	);
	if ( summary.isReady ) {
		console.log(
			`  ${ colors.green }${ colors.bold }STATUS: [READY] Environment is ready for local WordPress development!${ colors.reset }`
		);
		if ( summary.warnings > 0 ) {
			console.log(
				`  ${ colors.yellow }Notice: Non-blocking advisories detected. Review recommendations above.${ colors.reset }`
			);
		}
		console.log(
			`  Next step: Run ${ colors.bold }npm run env:start${ colors.reset } to launch containerized WordPress.`
		);
	} else {
		console.log(
			`  ${ colors.red }${ colors.bold }STATUS: [NOT READY] Required development prerequisites are missing.${ colors.reset }`
		);
		console.log(
			`  Follow the remediation actions above, then re-run ${ colors.bold }npm run pre-check${ colors.reset }.`
		);
		console.log(
			`  Documentation: docs/developers/development-prerequisites.md`
		);
	}
	console.log(
		`${ colors.cyan }================================================================================${ colors.reset }`
	);
	console.log( '' );

	process.exit( summary.isReady ? 0 : 1 );
}

main().catch( ( err ) => {
	console.error( 'Unexpected error running pre-check:', err );
	process.exit( 1 );
} );
