import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createZip, extractZip, listZip } from '../../../tools/release/lib/zip-utils.mjs';

test( 'createZip, listZip, and extractZip work deterministically without external dependencies', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-zip-test-' ) );
	const zipPath = join( tempDir, 'sample-package.zip' );
	const extractDir = join( tempDir, 'extracted' );

	try {
		const entries = [
			{ path: 'my-plugin/my-plugin.php', data: '<?php echo "Hello";' },
			{ path: 'my-plugin/readme.txt', data: '=== My Plugin ===\nStable tag: 1.0.0' },
			{ path: 'my-plugin/src/Core.php', data: '<?php class Core {}' },
			{ path: 'my-plugin/build/app.js', data: 'console.log("built asset");' },
		];

		const buildResult = await createZip( entries, zipPath );
		assert.equal( buildResult.zipPath, zipPath );
		assert.equal( buildResult.totalEntries, 4 );
		assert.equal( typeof buildResult.sha256, 'string' );
		assert.equal( buildResult.sha256.length, 64 );

		// List entries
		const listed = await listZip( zipPath );
		assert.equal( listed.length, 4 );
		const filenames = listed.map( ( e ) => e.filename );
		assert.deepEqual( filenames, [
			'my-plugin/build/app.js',
			'my-plugin/my-plugin.php',
			'my-plugin/readme.txt',
			'my-plugin/src/Core.php',
		] );

		// Extract
		const extracted = await extractZip( zipPath, extractDir );
		assert.equal( extracted.length, 4 );

		const extractedPhp = await readFile( join( extractDir, 'my-plugin/my-plugin.php' ), 'utf8' );
		assert.equal( extractedPhp, '<?php echo "Hello";' );

		const extractedReadme = await readFile( join( extractDir, 'my-plugin/readme.txt' ), 'utf8' );
		assert.equal( extractedReadme, '=== My Plugin ===\nStable tag: 1.0.0' );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
