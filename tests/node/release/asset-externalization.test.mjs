import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
	parseAssetPhp,
	verifyAssets,
	EXPECTED_ENTRYPOINTS,
} from '../../../tools/assets/verify-assets.mjs';

const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );
const projectRoot = resolve( __dirname, '../../..' );

test( 'parseAssetPhp parses valid PHP asset array syntax', () => {
	const php =
		"<?php return array('dependencies' => array('react', 'wp-element', 'wp-i18n'), 'version' => 'abc123hash');";
	const parsed = parseAssetPhp( php );

	assert.deepEqual( parsed.dependencies, [
		'react',
		'wp-element',
		'wp-i18n',
	] );
	assert.equal( parsed.version, 'abc123hash' );
} );

test( 'parseAssetPhp handles empty dependencies array', () => {
	const php =
		"<?php return array('dependencies' => array(), 'version' => '09876');";
	const parsed = parseAssetPhp( php );

	assert.deepEqual( parsed.dependencies, [] );
	assert.equal( parsed.version, '09876' );
} );

test( 'parseAssetPhp throws on invalid syntax', () => {
	assert.throws( () => {
		parseAssetPhp( '<?php echo "invalid";' );
	}, /Invalid asset\.php format/ );
} );

test( 'verifyAssets passes on valid built project assets', async () => {
	const result = await verifyAssets( projectRoot );
	assert.equal( result.valid, true );
	assert.equal( result.entrypoints.length, EXPECTED_ENTRYPOINTS.length );
	assert.equal(
		result.checks.every( ( c ) => c.pass ),
		true
	);
} );

test( 'verifyAssets fails if build directory does not exist', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-asset-test-none-' ) );
	try {
		const result = await verifyAssets( tempDir );
		assert.equal( result.valid, false );
		assert.equal(
			result.checks.some(
				( c ) => ! c.pass && c.name.includes( 'Build directory exists' )
			),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'verifyAssets fails when asset metadata is missing required dependencies', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-asset-test-bad-' ) );
	try {
		for ( const entry of EXPECTED_ENTRYPOINTS ) {
			const jsDir = join( tempDir, dirname( entry.jsPath ) );
			await mkdir( jsDir, { recursive: true } );
			await writeFile( join( tempDir, entry.jsPath ), '/* code */' );
			// Write asset.php without required dependencies
			await writeFile(
				join( tempDir, entry.assetPath ),
				"<?php return array('dependencies' => array('some-other-dep'), 'version' => '1.0');"
			);
		}

		const result = await verifyAssets( tempDir );
		assert.equal( result.valid, false );
		assert.equal(
			result.checks.some(
				( c ) =>
					! c.pass &&
					c.name.includes( 'External dependencies declared' )
			),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'verifyAssets fails if JS bundle accidentally inlines internal @wordpress/ code', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-asset-test-leak-' ) );
	try {
		for ( const entry of EXPECTED_ENTRYPOINTS ) {
			const jsDir = join( tempDir, dirname( entry.jsPath ) );
			await mkdir( jsDir, { recursive: true } );
			// Intentionally simulate bundled module
			const jsCode =
				entry.name === 'admin/settings/index'
					? '/* code */\nimport "node_modules/@wordpress/components/button";'
					: '/* clean code */';
			await writeFile( join( tempDir, entry.jsPath ), jsCode );
			await writeFile(
				join( tempDir, entry.assetPath ),
				`<?php return array('dependencies' => array(${ entry.requiredDeps
					.map( ( d ) => `'${ d }'` )
					.join( ', ' ) }), 'version' => '1.0');`
			);
		}

		const result = await verifyAssets( tempDir );
		assert.equal( result.valid, false );
		assert.equal(
			result.checks.some(
				( c ) =>
					! c.pass &&
					c.name.includes(
						'No internal @wordpress/* module bundling'
					)
			),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
