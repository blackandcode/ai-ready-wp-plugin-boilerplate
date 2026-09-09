#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';

const cwd = process.cwd();
const candidates = [ cwd, resolve( cwd, '..' ), resolve( cwd, '../..' ) ];
const root =
	candidates.find(
		( dir ) =>
			existsSync( join( dir, 'composer.json' ) ) &&
			existsSync( join( dir, 'src' ) )
	) || cwd;

const specPath = join( root, 'docs/api/openapi.yaml' );
const restRoot = join( root, 'src/backend/Apps' );
const controllers = [];

function walk( dir ) {
	if ( ! existsSync( dir ) ) {
		return;
	}
	for ( const entry of readdirSync( dir, { withFileTypes: true } ) ) {
		const path = join( dir, entry.name );
		if ( entry.isDirectory() ) {
			walk( path );
			continue;
		}
		if ( /Controller\.php$/.test( entry.name ) ) {
			const text = readFileSync( path, 'utf8' );
			if (
				text.includes( 'WP_REST_Controller' ) ||
				text.includes( 'register_rest_route' )
			) {
				controllers.push(
					relative( root, path ).replaceAll( '\\', '/' )
				);
			}
		}
	}
}

walk( restRoot );

const result = {
	root: root.replaceAll( '\\', '/' ),
	openapiSpec: existsSync( specPath )
		? relative( root, specPath ).replaceAll( '\\', '/' )
		: null,
	openapiSpecExists: existsSync( specPath ),
	restControllers: controllers.sort(),
	expectedCommands: [
		'wp ai-ready openapi generate',
		'wp ai-ready openapi check',
		'npm run openapi:lint',
	],
};

process.stdout.write( `${ JSON.stringify( result, null, 2 ) }\n` );
