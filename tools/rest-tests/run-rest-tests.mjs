import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const envPath = resolve( process.cwd(), '.env' );
const envVars = { ...process.env };

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
			envVars[ key ] = val;
		}
	}
}

const isHtml = process.argv.includes( '--html' );
const args = [
	'bru',
	'run',
	'--env',
	'Local',
	'--reporter-skip-headers',
	'Authorization',
	'Cookie',
	'X-WP-Nonce',
];

if ( isHtml ) {
	mkdirSync( resolve( process.cwd(), 'tests/bruno/reports' ), { recursive: true } );
	args.push( '--reporter-html', 'reports/test-results.html' );
}

const result = spawnSync( 'npx', args, {
	cwd: resolve( process.cwd(), 'tests/bruno' ),
	env: envVars,
	stdio: 'inherit',
	shell: process.platform === 'win32',
} );

process.exit( result.status ?? 0 );
