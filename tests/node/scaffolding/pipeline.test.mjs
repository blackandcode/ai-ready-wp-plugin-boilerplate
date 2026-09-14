import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
	ScaffoldPipeline,
	createDefaultScaffoldPipeline,
} from '../../../tools/scaffolding/lib/pipeline.mjs';

test( 'ScaffoldPipeline executes steps sequentially and respects enabled predicate', async () => {
	const log = [];
	const pipeline = new ScaffoldPipeline( { customFlag: true } );

	pipeline.addStep( {
		id: 'step1',
		name: 'Step 1',
		enabled: () => true,
		run: async ( ctx ) => {
			log.push( 'step1' );
			ctx.sharedValue = 42;
		},
	} );

	pipeline.addStep( {
		id: 'step2',
		name: 'Step 2 (disabled)',
		enabled: () => false,
		run: async () => {
			log.push( 'step2' );
		},
	} );

	pipeline.addStep( {
		id: 'step3',
		name: 'Step 3',
		enabled: ( ctx ) => ctx.sharedValue === 42,
		run: async () => {
			log.push( 'step3' );
		},
	} );

	const result = await pipeline.execute();
	assert.deepEqual( log, [ 'step1', 'step3' ] );
	assert.equal( result.sharedValue, 42 );
} );

test( 'createDefaultScaffoldPipeline rolls back disk changes on step error', async () => {
	const dir = await mkdtemp( join( tmpdir(), 'pipeline-rollback-test-' ) );
	try {
		const filePath = join( dir, 'file.txt' );
		await writeFile( filePath, 'Original content', 'utf8' );

		const pipeline = createDefaultScaffoldPipeline( {
			root: dir,
			dryRun: false,
		} );

		// Inject failing step before or during transaction
		pipeline.addStep( {
			id: 'simulate-failure',
			name: 'Simulated Failure',
			enabled: () => true,
			run: async () => {
				throw new Error( 'Simulated unexpected disk write error' );
			},
		} );

		await assert.rejects(
			async () => {
				await pipeline.execute();
			},
			{
				message: /Simulated unexpected disk write error/,
			}
		);
	} finally {
		await rm( dir, { recursive: true, force: true } );
	}
} );
