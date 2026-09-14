/**
 * Scaffold Engine Facade
 *
 * Provides backwards-compatible exports delegating to the modular scaffolding pipeline.
 */

import {
	detectCurrentPlugin,
	slugify,
	toCamelCase,
	toPascalCase,
} from './lib/detect.mjs';
import {
	ScaffoldPipeline,
	createDefaultScaffoldPipeline,
} from './lib/pipeline.mjs';

export {
	detectCurrentPlugin,
	slugify,
	toCamelCase,
	toPascalCase,
	ScaffoldPipeline,
	createDefaultScaffoldPipeline,
};

/**
 * Scaffolds and rebrands the plugin repository using the modular pipeline.
 *
 * @param {Object} options Scaffolding configuration options.
 * @return {Promise<Object>} Scaffolding summary result.
 */
export async function scaffoldPlugin( options = {} ) {
	const pipeline = createDefaultScaffoldPipeline( options );
	const context = await pipeline.execute();

	const modifiedFiles = Array.from( context.changes.values() ).map(
		( c ) => c.path
	);
	const renamedFiles = context.fileRenames.map( ( r ) => ( {
		from: r.relativeFrom || r.from,
		to: r.relativeTo || r.to,
	} ) );
	const deletedFiles = Array.from( context.deletedFiles.values() ).map(
		( d ) => d.relativePath || d.path
	);

	return {
		dryRun: context.dryRun,
		current: context.current,
		target: context.target,
		modifiedCount: context.changes.size,
		renamedCount: context.fileRenames.length,
		deletedCount: context.deletedFiles.size,
		cleanedAdrsCount: context.cleanedAdrsCount,
		cleanedImplementationLogsCount: context.cleanedImplementationLogsCount,
		modifiedFiles,
		renamedFiles,
		deletedFiles,
	};
}
