import { access, readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { join, relative } from 'node:path';

export function normalizePath( root, absolutePath ) {
	return relative( root, absolutePath ).split( '\\' ).join( '/' );
}

export async function fileExists( path ) {
	try {
		await access( path );
		return true;
	} catch {
		return false;
	}
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
	let currentSlug = 'wp-ai-ready-plugin-boilerplate';
	let currentName = 'WP AI Ready Plugin Boilerplate';
	let currentDescription = '';
	let currentPluginDescription = '';
	let currentAuthor = 'Plugin Developer';
	let currentVersion = '1.0.0';

	if ( await fileExists( packagePath ) ) {
		try {
			const pkg = JSON.parse( await readFile( packagePath, 'utf8' ) );
			if ( pkg.name ) {
				currentSlug = pkg.name;
			}
			if ( pkg.description ) {
				currentDescription = pkg.description;
			}
			if ( pkg.version ) {
				currentVersion = pkg.version;
			}
		} catch {
			// ignore JSON parse errors
		}
	}

	const composerPath = join( root, 'composer.json' );
	let currentNamespace = 'AIReady\\WPPluginBoilerplate';
	let currentComposerName = '';
	if ( await fileExists( composerPath ) ) {
		try {
			const comp = JSON.parse( await readFile( composerPath, 'utf8' ) );
			if ( comp.name ) {
				currentComposerName = comp.name;
			}
			if ( comp.autoload?.[ 'psr-4' ] ) {
				const nsList = Object.keys( comp.autoload[ 'psr-4' ] )
					.map( ( ns ) => ns.replace( /\\+$/, '' ) )
					.filter( Boolean );
				if ( nsList.length > 0 ) {
					const splitLists = nsList.map( ( ns ) => ns.split( '\\' ) );
					const commonParts = [];
					for ( let i = 0; i < splitLists[ 0 ].length; i++ ) {
						const part = splitLists[ 0 ][ i ];
						if ( splitLists.every( ( parts ) => parts[ i ] === part ) ) {
							commonParts.push( part );
						} else {
							break;
						}
					}
					if ( commonParts.length > 0 ) {
						currentNamespace = commonParts.join( '\\' );
					} else {
						currentNamespace = nsList[ 0 ];
					}
				}
			}
		} catch {
			// ignore JSON parse errors
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
			const descMatch = content.match( /Description:\s*([^\r\n*]+)/ );
			if ( descMatch ) {
				currentPluginDescription = descMatch[ 1 ].trim();
			}
			const verMatch = content.match( /Version:\s*([^\r\n*]+)/ );
			if ( verMatch && ! currentVersion ) {
				currentVersion = verMatch[ 1 ].trim();
			}
			break;
		}
	}

	if ( ! mainPhpFile ) {
		mainPhpFile = `${ currentSlug }.php`;
	}

	// Detect current constant prefix
	let currentPrefix = 'WPAIBP_';
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
	let currentRestNamespace = 'wpaibp/v1';
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

	// Detect current block metadata from block.json (src/frontend/apps/hello-world/block.json)
	let currentBlockName = 'wpaibp/hello-world';
	let currentBlockTitle = 'Hello World';
	let currentBlockDescription =
		'A modern interactive starter block for WP AI Ready Plugin Boilerplate.';
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
			if ( blockJson.title ) {
				currentBlockTitle = blockJson.title;
			}
			if ( blockJson.description ) {
				currentBlockDescription = blockJson.description;
			}
		} catch {
			// ignore
		}
	}

	// Detect current WP-CLI root command
	let currentCliCommand = 'ai-ready';
	const backendProviderPath = join(
		root,
		'src/backend/BackendServiceProvider.php'
	);
	if ( await fileExists( backendProviderPath ) ) {
		const content = await readFile( backendProviderPath, 'utf8' );
		const cliMatch = content.match(
			/WP_CLI::add_command\(\s*['"]([a-zA-Z0-9_-]+)['"]/
		);
		if ( cliMatch && cliMatch[ 1 ] ) {
			currentCliCommand = cliMatch[ 1 ];
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
		version: currentVersion,
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
		blockTitle: currentBlockTitle,
		blockDescription: currentBlockDescription,
		cliCommand: currentCliCommand,
		mainPhpFile,
		description: currentPluginDescription || currentDescription,
		pluginDescription: currentPluginDescription,
		packageDescription: currentDescription,
		author: currentAuthor,
	};
}
