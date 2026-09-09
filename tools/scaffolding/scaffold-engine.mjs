import {
	access,
	chmod,
	readFile,
	rename,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';

const DEFAULT_EXCLUDES = [
	'.git/**',
	'.svn/**',
	'.hg/**',
	'node_modules/**',
	'vendor/**',
	'build/**',
	'dist/**',
	'coverage/**',
	'tests/coverage/**',
	'playwright-report/**',
	'tests/playwright-report/**',
	'test-results/**',
	'tests/test-results/**',
	'bruno/reports/**',
	'tests/bruno/reports/**',
	'.auth/**',
	'tests/**/.auth/**',
	'.phpunit.cache/**',
	'tests/.phpunit.cache/**',
	'.wp-env/**',
	'**/*.zip',
	'**/*.tar',
	'**/*.tar.gz',
	'**/*.png',
	'**/*.jpg',
	'**/*.jpeg',
	'**/*.gif',
	'**/*.webp',
	'**/*.ico',
	'**/*.woff',
	'**/*.woff2',
	'**/*.ttf',
	'**/*.eot',
	'**/*.pdf',
];

const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024;

function normalizePath( root, absolutePath ) {
	return relative( root, absolutePath ).split( '\\' ).join( '/' );
}

async function fileExists( path ) {
	try {
		await access( path );
		return true;
	} catch {
		return false;
	}
}

function isLikelyBinary( buffer ) {
	const sampleLength = Math.min( buffer.length, 8192 );
	for ( let index = 0; index < sampleLength; index += 1 ) {
		if ( buffer[ index ] === 0 ) {
			return true;
		}
	}
	return false;
}

export function slugify( str ) {
	return str
		.toLowerCase()
		.trim()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
}

export function toPascalCase( str ) {
	const normalized = /^[A-Z0-9_]+$/.test( str ) ? str.toLowerCase() : str;
	return normalized
		.replace( /[^a-zA-Z0-9]+(.)/g, ( _, chr ) => chr.toUpperCase() )
		.replace( /^[a-z]/, ( chr ) => chr.toUpperCase() );
}

export function toCamelCase( str ) {
	const pascal = toPascalCase( str );
	return pascal ? pascal.charAt( 0 ).toLowerCase() + pascal.slice( 1 ) : '';
}

export async function detectCurrentPlugin( root ) {
	const packagePath = join( root, 'package.json' );
	let currentSlug = 'ai-ready-wp-plugin-boilerplate';
	let currentName = 'AI-Ready WP Plugin Boilerplate';
	let currentDescription = '';
	let currentAuthor = 'WordPress AI Team';

	if ( await fileExists( packagePath ) ) {
		const pkg = JSON.parse( await readFile( packagePath, 'utf8' ) );
		if ( pkg.name ) {
			currentSlug = pkg.name;
		}
		if ( pkg.description ) {
			currentDescription = pkg.description;
		}
	}

	const composerPath = join( root, 'composer.json' );
	let currentNamespace = 'AIReady\\WPPluginBoilerplate';
	let currentComposerName = '';
	if ( await fileExists( composerPath ) ) {
		const comp = JSON.parse( await readFile( composerPath, 'utf8' ) );
		if ( comp.name ) {
			currentComposerName = comp.name;
		}
		if ( comp.autoload?.[ 'psr-4' ] ) {
			const firstNs = Object.keys( comp.autoload[ 'psr-4' ] )[ 0 ];
			if ( firstNs ) {
				currentNamespace = firstNs.replace( /\\+$/, '' );
			}
		}
	}

	// Find root PHP file
	let mainPhpFile = null;
	for await ( const entry of glob( [ '*.php' ], {
		cwd: root,
		followSymlinks: false,
	} ) ) {
		const filePath = join( root, entry );
		const content = await readFile( filePath, 'utf8' );
		if ( content.includes( 'Plugin Name:' ) ) {
			mainPhpFile = entry;
			const nameMatch = content.match( /Plugin Name:\s*([^\r\n*]+)/ );
			if ( nameMatch ) {
				currentName = nameMatch[ 1 ].trim();
			}
			const authorMatch = content.match( /Author:\s*([^\r\n*]+)/ );
			if ( authorMatch ) {
				currentAuthor = authorMatch[ 1 ].trim();
			}
			break;
		}
	}

	if ( ! mainPhpFile ) {
		mainPhpFile = `${ currentSlug }.php`;
	}

	// Detect current constant prefix
	let currentPrefix = 'AIRWP_';
	if ( await fileExists( join( root, mainPhpFile ) ) ) {
		const content = await readFile( join( root, mainPhpFile ), 'utf8' );
		const prefixMatch = content.match(
			/define\(\s*['"]([A-Z0-9_]+?)(?:PLUGIN_FILE|PLUGIN_DIR|PLUGIN_URL|VERSION)['"]/
		);
		if ( prefixMatch && prefixMatch[ 1 ] ) {
			currentPrefix = prefixMatch[ 1 ].endsWith( '_' )
				? prefixMatch[ 1 ]
				: `${ prefixMatch[ 1 ] }_`;
		}
	}

	// Detect current REST namespace from controllers
	let currentRestNamespace = 'ai-ready-wp/v1';
	const restCandidates = [
		join(
			root,
			'src/backend/Apps/HelloWorld/Rest/HelloWorldController.php'
		),
		join( root, 'src/backend/Apps/Settings/Rest/SettingsController.php' ),
		join( root, 'src/Rest/Controller/HelloWorldController.php' ),
		join( root, 'src/Rest/Controller/SettingsController.php' ),
	];
	for ( const candidate of restCandidates ) {
		if ( await fileExists( candidate ) ) {
			const content = await readFile( candidate, 'utf8' );
			const restMatch = content.match(
				/protected\s+\$namespace\s*=\s*['"]([^'"]+)['"]/
			);
			if ( restMatch && restMatch[ 1 ] ) {
				currentRestNamespace = restMatch[ 1 ];
				break;
			}
		}
	}

	// Detect current block name from block.json (src/frontend/apps/hello-world/block.json)
	let currentBlockName = 'ai-ready-wp/hello-world';
	const blockJsonPath = join(
		root,
		'src/frontend/apps/hello-world/block.json'
	);
	if ( await fileExists( blockJsonPath ) ) {
		try {
			const blockJson = JSON.parse(
				await readFile( blockJsonPath, 'utf8' )
			);
			if ( blockJson.name ) {
				currentBlockName = blockJson.name;
			}
		} catch {
			// ignore
		}
	}

	const currentPrefixBase = currentPrefix.replace( /_+$/, '' );
	const currentLowerUnderscorePrefix = currentPrefix.toLowerCase();
	const currentLowerHyphenPrefix =
		currentPrefix.toLowerCase().replace( /_+$/, '' ).replace( /_/g, '-' ) +
		'-';
	const currentPascalPrefix = toPascalCase( currentPrefixBase );
	const currentCamelPrefix = toCamelCase( currentPrefixBase );

	return {
		slug: currentSlug,
		name: currentName,
		namespace: currentNamespace,
		composerName: currentComposerName,
		prefix: currentPrefix,
		prefixBase: currentPrefixBase,
		lowerUnderscorePrefix: currentLowerUnderscorePrefix,
		lowerHyphenPrefix: currentLowerHyphenPrefix,
		pascalPrefix: currentPascalPrefix,
		camelPrefix: currentCamelPrefix,
		restNamespace: currentRestNamespace,
		blockName: currentBlockName,
		mainPhpFile,
		description: currentDescription,
		author: currentAuthor,
	};
}

export async function scaffoldPlugin( {
	root = process.cwd(),
	name,
	slug,
	namespace,
	prefix,
	textDomain,
	author,
	description,
	restNamespace,
	blockName,
	composerName,
	dryRun = false,
} ) {
	const current = await detectCurrentPlugin( root );

	const targetName = name || 'My Custom WordPress Plugin';
	const targetSlug = slug || slugify( targetName );
	const targetAuthor = author || 'Plugin Developer';
	const targetNamespace =
		namespace ||
		`${ toPascalCase( targetAuthor ) }\\${ toPascalCase( targetSlug ) }`;
	let targetPrefix = (
		prefix ||
		`${ targetSlug.replace( /[^a-zA-Z0-9]/g, '_' ).toUpperCase() }_`
	).trim();
	if ( ! targetPrefix.endsWith( '_' ) ) {
		targetPrefix += '_';
	}
	const targetTextDomain = textDomain || targetSlug;
	const targetDescription =
		description ||
		`Production-ready WordPress plugin built with the Agentic Boilerplate.`;
	const targetRestNamespace = restNamespace || `${ targetSlug }/v1`;
	const targetBlockName = blockName || `${ targetSlug }/hello-world`;

	const targetPrefixBase = targetPrefix.replace( /_+$/, '' );
	const targetLowerUnderscorePrefix = targetPrefix.toLowerCase();
	const targetLowerHyphenPrefix =
		targetPrefix.toLowerCase().replace( /_+$/, '' ).replace( /_/g, '-' ) +
		'-';
	const targetPascalPrefix = toPascalCase( targetPrefixBase );
	const targetCamelPrefix = toCamelCase( targetPrefixBase );

	const currentComposerName = current.composerName || '';
	let targetComposerName = composerName || '';
	if ( ! targetComposerName && currentComposerName ) {
		if ( currentComposerName.includes( '/' ) ) {
			const [ currVendor ] = currentComposerName.split( '/' );
			const targetVendor = author ? slugify( author ) : currVendor;
			targetComposerName = `${ targetVendor }/${ targetSlug }`;
		} else {
			targetComposerName = targetSlug;
		}
	}

	const replacements = [
		// 1. Double backslash namespace (JSON files)
		{
			from: current.namespace.replaceAll( '\\', '\\\\' ),
			to: targetNamespace.replaceAll( '\\', '\\\\' ),
		},
		// 2. Single backslash namespace (PHP / TS / Docs)
		{
			from: current.namespace,
			to: targetNamespace,
		},
		// 3. Main PHP filename references
		{
			from: current.mainPhpFile,
			to: `${ targetSlug }.php`,
		},
		// 4. Exact Plugin Display Name
		{
			from: current.name,
			to: targetName,
		},
		// 5. REST route namespace (dynamically discovered)
		{
			from: current.restNamespace,
			to: targetRestNamespace,
		},
		// 6. Block identifier (dynamically discovered)
		{
			from: current.blockName,
			to: targetBlockName,
		},
		// 7. Composer package name
		...( currentComposerName &&
		targetComposerName &&
		currentComposerName !== targetComposerName
			? [ { from: currentComposerName, to: targetComposerName } ]
			: [] ),
		// 8. Uppercase Constant Prefix
		{
			from: current.prefix,
			to: targetPrefix,
		},
		// 9. Lowercase Underscore Prefix (e.g. airwp_ -> airwp_)
		{
			from: current.lowerUnderscorePrefix,
			to: targetLowerUnderscorePrefix,
		},
		// 10. Lowercase Hyphen Prefix (e.g. airwp- -> airwp-)
		...( current.lowerHyphenPrefix !== targetLowerHyphenPrefix
			? [
					{
						from: current.lowerHyphenPrefix,
						to: targetLowerHyphenPrefix,
					},
			  ]
			: [] ),
		// 11. PascalCase Prefix (e.g. AirwpBootstrapData -> AirwpBootstrapData)
		...( current.pascalPrefix !== targetPascalPrefix
			? [ { from: current.pascalPrefix, to: targetPascalPrefix } ]
			: [] ),
		// 12. CamelCase Global Bootstrap variable (e.g. airwpAdminBootstrap -> airwpAdminBootstrap)
		...( current.camelPrefix !== targetCamelPrefix
			? [
					{
						from: `${ current.camelPrefix }AdminBootstrap`,
						to: `${ targetCamelPrefix }AdminBootstrap`,
					},
			  ]
			: [] ),
		// 13. Slug / Textdomain
		{
			from: current.slug,
			to: targetSlug,
		},
		// 14. Author
		...( current.author !== targetAuthor
			? [ { from: current.author, to: targetAuthor } ]
			: [] ),
	];

	const changes = new Map();
	const fileRenames = [];

	// Plan rename of the main plugin file if changed
	const oldMainPhpPath = join( root, current.mainPhpFile );
	const newMainPhpPath = join( root, `${ targetSlug }.php` );
	if (
		oldMainPhpPath !== newMainPhpPath &&
		( await fileExists( oldMainPhpPath ) )
	) {
		fileRenames.push( {
			from: oldMainPhpPath,
			to: newMainPhpPath,
			relativeFrom: normalizePath( root, oldMainPhpPath ),
			relativeTo: normalizePath( root, newMainPhpPath ),
		} );
	}

	// Scan all eligible project files
	for await ( const entry of glob( [ '**/*', '.*', '**/.*' ], {
		cwd: root,
		exclude: DEFAULT_EXCLUDES,
		followSymlinks: false,
		withFileTypes: true,
	} ) ) {
		if ( ! entry.isFile() ) {
			continue;
		}

		const absolutePath = resolve(
			entry.parentPath ?? dirname( join( root, entry.name ) ),
			entry.name
		);
		const projectPath = normalizePath( root, absolutePath );

		// Skip git, node_modules, vendor, build
		if (
			projectPath.startsWith( '.git/' ) ||
			projectPath.startsWith( 'node_modules/' ) ||
			projectPath.startsWith( 'vendor/' )
		) {
			continue;
		}

		const fileStat = await stat( absolutePath );
		if ( fileStat.size > MAX_TEXT_FILE_BYTES ) {
			continue;
		}

		const buffer = await readFile( absolutePath );
		if ( isLikelyBinary( buffer ) ) {
			continue;
		}

		let content = buffer.toString( 'utf8' );
		const original = content;

		for ( const rule of replacements ) {
			if (
				rule.from &&
				rule.from !== rule.to &&
				content.includes( rule.from )
			) {
				content = content.replaceAll( rule.from, rule.to );
			}
		}

		if ( content !== original ) {
			changes.set( absolutePath, {
				path: projectPath,
				before: original,
				after: content,
			} );
		}
	}

	if ( ! dryRun ) {
		const committedFiles = [];
		try {
			// 1. Commit text replacements
			for ( const [ absPath, change ] of changes ) {
				const fileState = await stat( absPath );
				const tempPath = `${ absPath }.scaffold-${ process.pid }.tmp`;
				await writeFile( tempPath, change.after, {
					encoding: 'utf8',
					mode: fileState.mode,
				} );
				await chmod( tempPath, fileState.mode );
				await rename( tempPath, absPath );
				committedFiles.push( {
					path: absPath,
					before: change.before,
					mode: fileState.mode,
				} );
			}

			// 2. Perform file renames
			for ( const renameOp of fileRenames ) {
				await rename( renameOp.from, renameOp.to );
			}
		} catch ( err ) {
			// Rollback committed files on error
			for ( const file of committedFiles.reverse() ) {
				await writeFile( file.path, file.before, {
					encoding: 'utf8',
					mode: file.mode,
				} );
			}
			throw new Error(
				`Scaffolding failed and changes were rolled back: ${ err.message }`
			);
		}
	}

	return {
		dryRun,
		current,
		target: {
			name: targetName,
			slug: targetSlug,
			namespace: targetNamespace,
			prefix: targetPrefix,
			textDomain: targetTextDomain,
			author: targetAuthor,
			description: targetDescription,
			restNamespace: targetRestNamespace,
			blockName: targetBlockName,
			composerName: targetComposerName,
			mainPhpFile: `${ targetSlug }.php`,
		},
		modifiedCount: changes.size,
		renamedCount: fileRenames.length,
		modifiedFiles: Array.from( changes.values() ).map( ( c ) => c.path ),
		renamedFiles: fileRenames.map( ( r ) => ( {
			from: r.relativeFrom,
			to: r.relativeTo,
		} ) ),
	};
}
