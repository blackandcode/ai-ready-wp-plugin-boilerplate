#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';

const WORKFLOWS_DIR = resolve( process.cwd(), '.github/workflows' );
const VERSION_TAG_REGEX = /^v?[0-9]+(\.[0-9]+)*(-[a-zA-Z0-9.]+)?$/;

/**
 * Validates workflow YAML files for version tagging, required top-level keys, and syntax.
 */
async function lintWorkflows() {
	let files = [];
	try {
		files = ( await readdir( WORKFLOWS_DIR ) ).filter(
			( f ) => f.endsWith( '.yml' ) || f.endsWith( '.yaml' )
		);
	} catch {
		console.log(
			'No .github/workflows directory found. Skipping workflow linting.'
		);
		return;
	}

	let hasErrors = false;
	const actionlintAvailable =
		spawnSync( 'which', [ 'actionlint' ] ).status === 0;

	if ( actionlintAvailable ) {
		console.log( '🔍 Running actionlint binary...' );
		const res = spawnSync( 'actionlint', {
			stdio: 'inherit',
			cwd: process.cwd(),
		} );
		if ( res.status !== 0 ) {
			hasErrors = true;
		}
	} else {
		console.log(
			'ℹ️  actionlint binary not detected on PATH; running in-tree workflow static validator...'
		);
	}

	for ( const file of files ) {
		const filePath = join( WORKFLOWS_DIR, file );
		const content = await readFile( filePath, 'utf8' );
		const lines = content.split( '\n' );

		console.log( `Checking ${ file }...` );

		// 1. Basic structure check
		if ( ! content.includes( 'name:' ) ) {
			console.error( `❌ [${ file }] Missing top-level "name:" field.` );
			hasErrors = true;
		}
		if ( ! content.includes( 'on:' ) ) {
			console.error( `❌ [${ file }] Missing top-level "on:" field.` );
			hasErrors = true;
		}
		if ( ! content.includes( 'permissions:' ) ) {
			console.error(
				`❌ [${ file }] Missing top-level "permissions:" block (least-privilege requirement).`
			);
			hasErrors = true;
		}

		// 2. Version tag validation for external actions
		for ( let lineIdx = 0; lineIdx < lines.length; lineIdx++ ) {
			const line = lines[ lineIdx ];
			const usesMatch = line.match(
				/^\s*(?:-\s+)?uses:\s*([^#\s]+)(?:\s+#\s*(.*))?$/
			);
			if ( ! usesMatch ) {
				continue;
			}

			const actionRef = usesMatch[ 1 ].trim();

			// Skip local reusable workflows or actions (e.g. ./.github/workflows/...)
			if (
				actionRef.startsWith( './' ) ||
				actionRef.startsWith( '../' )
			) {
				continue;
			}

			const atIdx = actionRef.indexOf( '@' );
			if ( atIdx === -1 ) {
				console.error(
					`❌ [${ file }:${
						lineIdx + 1
					}] Unversioned action reference "${ actionRef }". Reference a semantic version tag (e.g. "@v4").`
				);
				hasErrors = true;
				continue;
			}

			const actionName = actionRef.slice( 0, atIdx );
			const ref = actionRef.slice( atIdx + 1 );

			if ( ! VERSION_TAG_REGEX.test( ref ) ) {
				console.error(
					`❌ [${ file }:${
						lineIdx + 1
					}] Action "${ actionName }" has reference "${ ref }". It MUST reference a valid semantic version tag (e.g. "uses: ${ actionName }@v4").`
				);
				hasErrors = true;
			}
		}
	}

	if ( hasErrors ) {
		console.error( '\n🚫 Workflow validation failed with errors.' );
		process.exit( 1 );
	} else {
		console.log(
			'\n✅ All GitHub Actions workflow files passed static validation & version-tagging checks.'
		);
	}
}

await lintWorkflows();
