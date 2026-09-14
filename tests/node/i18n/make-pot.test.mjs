import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildMoBuffer, makePot } from '../../../tools/i18n/make-pot.mjs';

test( 'buildMoBuffer encodes valid GNU gettext binary header', () => {
	const messages = [
		{ msgid: '', msgstr: 'Project-Id-Version: Sample\n' },
		{ msgid: 'Hello', msgstr: 'Hello' },
		{ msgid: 'World', msgstr: 'World' },
	];

	const buffer = buildMoBuffer( messages );
	assert.ok( buffer instanceof Buffer );
	assert.ok( buffer.length > 28 );

	// Magic number 0x950412de
	assert.equal( buffer.readUInt32LE( 0 ), 0x950412de );
	// Revision 0
	assert.equal( buffer.readUInt32LE( 4 ), 0 );
	// String count 3
	assert.equal( buffer.readUInt32LE( 8 ), 3 );
} );

test( 'makePot extracts strings from PHP and JS files and writes .pot, .po, and .mo', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'i18n-test-' ) );

	try {
		await writeFile(
			join( tempDir, 'sample-plugin.php' ),
			`<?php
/**
 * Plugin Name: Sample Plugin
 * Text Domain: sample-plugin
 */
define( 'SAMPLE_PLUGIN_FILE', __FILE__ );
`
		);

		await mkdir( join( tempDir, 'src' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'src/example.php' ),
			`<?php
esc_html_e( 'Save changes', 'sample-plugin' );
$title = __( 'Settings Title', 'sample-plugin' );
`
		);

		await writeFile(
			join( tempDir, 'src/example.tsx' ),
			`
const msg = __( 'Cancel action', 'sample-plugin' );
`
		);

		const result = await makePot( { root: tempDir } );
		assert.equal( result.totalStrings, 3 );

		const potContent = await readFile( result.potPath, 'utf8' );
		assert.ok( potContent.includes( 'msgid "Save changes"' ) );
		assert.ok( potContent.includes( 'msgid "Settings Title"' ) );
		assert.ok( potContent.includes( 'msgid "Cancel action"' ) );
		assert.ok( potContent.includes( 'X-Domain: sample-plugin' ) );

		const poContent = await readFile( result.poPath, 'utf8' );
		assert.ok( poContent.includes( 'msgstr "Save changes"' ) );

		const moBuffer = await readFile( result.moPath );
		assert.equal( moBuffer.readUInt32LE( 0 ), 0x950412de );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
