import { rm, stat, writeFile } from 'node:fs/promises';
import {
	detectCurrentPlugin,
	fileExists,
	normalizePath,
	slugify,
	toCamelCase,
	toPascalCase,
} from './detect.mjs';
import {
	cleanAdrs,
	cleanChangelog,
	cleanImplementationLogs,
	cleanLegacyDecisionLog,
	cleanReadmeChangelog,
} from './history-cleaner.mjs';
import { resetProjectVersion } from './version-resetter.mjs';
import { buildReplacements } from './replacements.mjs';
import {
	commitTextChanges,
	rollbackCommittedWrites,
	scanFiles,
} from './transformer.mjs';
import {
	commitRenames,
	planRenames,
	rollbackCommittedRenames,
} from './renamer.mjs';
import { syncManifest } from './manifest-sync.mjs';

export class ScaffoldPipeline {
	constructor( options = {} ) {
		this.options = {
			root: process.cwd(),
			dryRun: false,
			cleanHistory: true,
			resetVersion: true,
			targetVersion: '1.0.0',
			...options,
		};
		this.steps = [];
	}

	addStep( step ) {
		this.steps.push( step );
		return this;
	}

	async execute() {
		const context = {
			options: this.options,
			root: this.options.root,
			dryRun: this.options.dryRun,
			current: null,
			target: null,
			replacements: [],
			changes: new Map(), // absPath -> { path, before, after, mode }
			deletedFiles: new Map(), // absPath -> { path, relativePath, content, mode }
			filesToCreate: new Map(), // absPath -> { path, relativePath, content }
			fileRenames: [],
			cleanedAdrsCount: 0,
			cleanedImplementationLogsCount: 0,
			committedWrites: [],
			committedRenames: [],
			committedDeletions: [],
			committedCreations: [],
		};

		for ( const step of this.steps ) {
			if ( ! step.enabled || step.enabled( context ) ) {
				await step.run( context );
			}
		}

		return context;
	}
}

/**
 * Creates and configures the standard scaffolding pipeline.
 *
 * @param {Object} options Scaffolding options.
 * @return {ScaffoldPipeline}
 */
export function createDefaultScaffoldPipeline( options ) {
	const pipeline = new ScaffoldPipeline( options );

	// Step 1: Detect current plugin and derive target configuration
	pipeline.addStep( {
		id: 'detect',
		name: 'Detect Project and Target Configuration',
		enabled: () => true,
		run: async ( context ) => {
			const current = await detectCurrentPlugin( context.root );
			context.current = current;

			const targetName =
				context.options.name || 'My Custom WordPress Plugin';
			const targetSlug =
				context.options.slug || slugify( targetName );
			const targetAuthor =
				context.options.author || 'Plugin Developer';
			const targetNamespace =
				context.options.namespace ||
				`${ toPascalCase( targetAuthor ) }\\${ toPascalCase(
					targetSlug
				) }`;

			let targetPrefix = (
				context.options.prefix ||
				`${ targetSlug.replace( /[^a-zA-Z0-9]/g, '_' ).toUpperCase() }_`
			).trim();
			if ( ! targetPrefix.endsWith( '_' ) ) {
				targetPrefix += '_';
			}

			const targetTextDomain =
				context.options.textDomain || targetSlug;
			const targetDescription =
				context.options.description?.trim() ||
				`A modern WordPress plugin for ${ targetName }.`;
			const targetGreeting =
				context.options.greeting?.trim() ||
				`Hello from ${ targetName }!`;
			const targetRestNamespace =
				context.options.restNamespace || `${ targetSlug }/v1`;
			const targetBlockName =
				context.options.blockName || `${ targetSlug }/hello-world`;
			const targetBlockTitle =
				context.options.blockTitle?.trim() || 'Hello World';
			const targetBlockDescription =
				context.options.blockDescription?.trim() ||
				`A modern interactive block for ${ targetName }.`;
			const currentCliCommand = current.cliCommand || 'ai-ready';
			const targetCliCommand =
				context.options.cliCommand ||
				targetSlug.replace( /-(?:plugin|boilerplate)$/, '' );

			const targetPrefixBase = targetPrefix.replace( /_+$/, '' );
			const targetLowerUnderscorePrefix = targetPrefix.toLowerCase();
			const targetLowerHyphenPrefix =
				targetPrefix.toLowerCase().replace( /_+$/, '' ).replace( /_/g, '-' ) +
				'-';
			const targetPascalPrefix = toPascalCase( targetPrefixBase );
			const targetCamelPrefix = toCamelCase( targetPrefixBase );

			const currentComposerName = current.composerName || '';
			let targetComposerName = context.options.composerName || '';
			if ( ! targetComposerName && currentComposerName ) {
				if ( currentComposerName.includes( '/' ) ) {
					const [ currVendor ] = currentComposerName.split( '/' );
					const targetVendor = context.options.author
						? slugify( context.options.author )
						: currVendor;
					targetComposerName = `${ targetVendor }/${ targetSlug }`;
				} else {
					targetComposerName = targetSlug;
				}
			}

			const currentVendorPrefix = current.restNamespace.includes( '/' )
				? current.restNamespace.split( '/' )[ 0 ]
				: current.slug;
			const targetVendorPrefix = targetRestNamespace.includes( '/' )
				? targetRestNamespace.split( '/' )[ 0 ]
				: targetSlug;

			const effectiveTargetVersion =
				context.options.resetVersion !== false
					? ( context.options.targetVersion || '1.0.0' )
					: current.version;

			context.current = {
				...current,
				vendorPrefix: currentVendorPrefix,
			};

			context.target = {
				name: targetName,
				slug: targetSlug,
				namespace: targetNamespace,
				prefix: targetPrefix,
				prefixBase: targetPrefixBase,
				lowerUnderscorePrefix: targetLowerUnderscorePrefix,
				lowerHyphenPrefix: targetLowerHyphenPrefix,
				pascalPrefix: targetPascalPrefix,
				camelPrefix: targetCamelPrefix,
				textDomain: targetTextDomain,
				author: targetAuthor,
				description: targetDescription,
				greeting: targetGreeting,
				restNamespace: targetRestNamespace,
				blockName: targetBlockName,
				blockTitle: targetBlockTitle,
				blockDescription: targetBlockDescription,
				composerName: targetComposerName,
				cliCommand: targetCliCommand,
				vendorPrefix: targetVendorPrefix,
				mainPhpFile: `${ targetSlug }.php`,
				version: effectiveTargetVersion,
			};
		},
	} );

	// Step 2: Clean History (CHANGELOG.md, readme.txt changelog, ADRs, implementation logs)
	pipeline.addStep( {
		id: 'clean-history',
		name: 'Clean Repository History & Audit Logs',
		enabled: ( context ) => context.options.cleanHistory !== false,
		run: async ( context ) => {
			const targetVersion = context.target.version;

			// 1. CHANGELOG.md
			const changelogResult = await cleanChangelog( {
				root: context.root,
				targetName: context.target.name,
				targetVersion,
				dryRun: context.dryRun,
			} );
			if ( changelogResult ) {
				context.changes.set( changelogResult.path, {
					path: changelogResult.relativePath,
					before: changelogResult.before,
					after: changelogResult.after,
				} );
			}

			// 2. readme.txt Changelog
			const readmeChangelogResult = await cleanReadmeChangelog( {
				root: context.root,
				targetName: context.target.name,
				targetVersion,
			} );
			if ( readmeChangelogResult ) {
				context.changes.set( readmeChangelogResult.path, {
					path: readmeChangelogResult.relativePath,
					before: readmeChangelogResult.before,
					after: readmeChangelogResult.after,
				} );
			}

			// 3. ADRs (0002+ deleted, 0001 kept, README.md table reset)
			const adrResult = await cleanAdrs( {
				root: context.root,
			} );
			for ( const item of adrResult.filesToDelete ) {
				context.deletedFiles.set( item.path, item );
			}
			for ( const item of adrResult.filesToModify ) {
				context.changes.set( item.path, {
					path: item.relativePath,
					before: item.before,
					after: item.after,
				} );
			}
			context.cleanedAdrsCount = adrResult.filesToDelete.length;

			// 4. Implementation logs (docs/implementation-logs/*.md deleted, .gitkeep created)
			const implLogsResult = await cleanImplementationLogs( {
				root: context.root,
			} );
			for ( const item of implLogsResult.filesToDelete ) {
				context.deletedFiles.set( item.path, item );
			}
			for ( const item of implLogsResult.filesToCreate ) {
				context.filesToCreate.set( item.path, item );
			}
			context.cleanedImplementationLogsCount =
				implLogsResult.filesToDelete.length;

			// 5. Legacy decision logs (docs/decision-log.md if present)
			const legacyLog = await cleanLegacyDecisionLog( {
				root: context.root,
			} );
			if ( legacyLog ) {
				context.deletedFiles.set( legacyLog.path, legacyLog );
			}
		},
	} );

	// Step 3: Reset Version (package.json, package-lock.json, composer.json, headers, Plugin::VERSION, block.json)
	pipeline.addStep( {
		id: 'reset-version',
		name: 'Reset Version Baseline',
		enabled: ( context ) => context.options.resetVersion !== false,
		run: async ( context ) => {
			const versionChanges = await resetProjectVersion( {
				root: context.root,
				currentVersion: context.current.version,
				targetVersion: context.target.version,
				mainPhpFile: context.current.mainPhpFile,
				targetPrefix: context.target.prefix,
				changes: context.changes,
			} );

			for ( const change of versionChanges ) {
				const existing = context.changes.get( change.path );
				context.changes.set( change.path, {
					path: change.relativePath,
					before: existing ? existing.before : change.before,
					after: change.after,
				} );
			}
		},
	} );

	// Step 4: Build Replacement Dictionary
	pipeline.addStep( {
		id: 'build-replacements',
		name: 'Build Token Replacements',
		enabled: () => true,
		run: async ( context ) => {
			context.replacements = buildReplacements(
				context.current,
				context.target
			);
		},
	} );

	// Step 5: Scan & Transform Text Files
	pipeline.addStep( {
		id: 'transform-files',
		name: 'Scan and Replace Tokens Across Project Files',
		enabled: () => true,
		run: async ( context ) => {
			await scanFiles( {
				root: context.root,
				replacements: context.replacements,
				changes: context.changes,
			} );
		},
	} );

	// Step 6: Plan File Renames
	pipeline.addStep( {
		id: 'plan-renames',
		name: 'Plan File Renames',
		enabled: () => true,
		run: async ( context ) => {
			context.fileRenames = await planRenames( {
				root: context.root,
				current: context.current,
				target: context.target,
			} );
		},
	} );

	// Step 7: Sync MANIFEST.md
	pipeline.addStep( {
		id: 'sync-manifest',
		name: 'Synchronize Repository Manifest',
		enabled: () => true,
		run: async ( context ) => {
			const manifestChange = await syncManifest( {
				root: context.root,
				deletedFiles: new Set(
					Array.from( context.deletedFiles.values() ).map(
						( d ) => d.relativePath
					)
				),
				renamedFiles: context.fileRenames,
			} );

			if ( manifestChange ) {
				const existing = context.changes.get( manifestChange.path );
				context.changes.set( manifestChange.path, {
					path: manifestChange.relativePath,
					before: existing ? existing.before : manifestChange.before,
					after: manifestChange.after,
				} );
			}
		},
	} );

	// Step 8: Commit Transactions
	pipeline.addStep( {
		id: 'commit-transactions',
		name: 'Commit Transactions to Disk',
		enabled: ( context ) => ! context.dryRun,
		run: async ( context ) => {
			try {
				// 1. Create needed files (e.g. .gitkeep)
				for ( const [ absPath, item ] of context.filesToCreate ) {
					if ( ! ( await fileExists( absPath ) ) ) {
						await writeFile( absPath, item.content, 'utf8' );
						context.committedCreations.push( absPath );
					}
				}

				// 2. Commit text modifications atomically
				await commitTextChanges(
					context.changes,
					context.committedWrites
				);

				// 3. Delete cleaned files
				for ( const [ absPath, item ] of context.deletedFiles ) {
					if ( await fileExists( absPath ) ) {
						await rm( absPath, { force: true } );
						context.committedDeletions.push( item );
					}
				}

				// 4. Perform file renames
				await commitRenames(
					context.fileRenames,
					context.committedRenames
				);
			} catch ( err ) {
				// Transaction rollback on failure
				await rollbackCommittedRenames( context.committedRenames );

				// Restore deleted files
				for ( const item of context.committedDeletions.reverse() ) {
					try {
						await writeFile( item.path, item.content, {
							encoding: 'utf8',
							mode: item.mode,
						} );
					} catch {
						// ignore
					}
				}

				// Rollback text modifications
				await rollbackCommittedWrites( context.committedWrites );

				// Remove created files
				for ( const createdPath of context.committedCreations.reverse() ) {
					try {
						await rm( createdPath, { force: true } );
					} catch {
						// ignore
					}
				}

				throw new Error(
					`Scaffolding failed and changes were rolled back: ${ err.message }`
				);
			}
		},
	} );

	return pipeline;
}
