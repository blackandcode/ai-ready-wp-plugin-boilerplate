import { slugify, toCamelCase, toPascalCase } from './detect.mjs';

/**
 * Builds the complete list of ordered string replacement rules for scaffolding.
 *
 * @param {Object} current Current plugin metadata detected by detectCurrentPlugin.
 * @param {Object} target Target plugin configuration.
 * @return {Array<{ from: string, to: string }>}
 */
export function buildReplacements( current, target ) {
	const currentDevRestNamespace = `${ current.vendorPrefix }-dev/v1`;
	const targetDevRestNamespace = `${ target.vendorPrefix }-dev/v1`;

	// 1. Descriptions to replace with target.description
	const candidateDescriptions = [
		'A modern WordPress plugin powered by AI workflows.',
		'A modern WordPress plugin powered by AI workflows',
		'Production-ready WordPress plugin boilerplate built for modern agentic AI development workflows.',
		'Enterprise-grade WordPress plugin boilerplate designed for AI coding agents and human developers.',
		'Production-ready WordPress plugin built with the Agentic Boilerplate.',
	];
	if ( current.pluginDescription ) {
		candidateDescriptions.push( current.pluginDescription );
	}
	if ( current.packageDescription ) {
		candidateDescriptions.push( current.packageDescription );
	}
	if ( current.description ) {
		candidateDescriptions.push( current.description );
	}

	const descriptionRules = [];
	const seenDescriptions = new Set();
	for ( const desc of candidateDescriptions ) {
		const trimmed = desc.trim();
		if (
			trimmed &&
			trimmed !== target.description &&
			! seenDescriptions.has( trimmed )
		) {
			seenDescriptions.add( trimmed );
			descriptionRules.push( { from: trimmed, to: target.description } );
		}
	}

	// 2. Greetings to replace with target.greeting
	const candidateGreetings = [
		'Hello from WP AI Ready Plugin Boilerplate!',
		'Hello from WP AI Ready Plugin Boilerplate',
	];
	if ( current.name ) {
		candidateGreetings.push( `Hello from ${ current.name }!` );
		candidateGreetings.push( `Hello from ${ current.name }` );
	}

	const greetingRules = [];
	const seenGreetings = new Set();
	for ( const greet of candidateGreetings ) {
		const trimmed = greet.trim();
		if (
			trimmed &&
			trimmed !== target.greeting &&
			! seenGreetings.has( trimmed )
		) {
			seenGreetings.add( trimmed );
			greetingRules.push( { from: trimmed, to: target.greeting } );
		}
	}

	// 3. Block descriptions to replace with target.blockDescription
	const candidateBlockDescriptions = [
		'A modern interactive starter block for WP AI Ready Plugin Boilerplate.',
		'A modern interactive starter block for WP AI Ready Plugin Boilerplate',
		'A modern interactive block for WP AI Ready Plugin Boilerplate.',
		'A modern interactive block for WP AI Ready Plugin Boilerplate',
	];
	if ( current.name ) {
		candidateBlockDescriptions.push(
			`A modern interactive starter block for ${ current.name }.`,
			`A modern interactive starter block for ${ current.name }`,
			`A modern interactive block for ${ current.name }.`,
			`A modern interactive block for ${ current.name }`
		);
	}
	if ( current.blockDescription ) {
		candidateBlockDescriptions.push( current.blockDescription );
	}

	const blockDescRules = [];
	const seenBlockDescs = new Set();
	for ( const bDesc of candidateBlockDescriptions ) {
		const trimmed = bDesc.trim();
		if (
			trimmed &&
			trimmed !== target.blockDescription &&
			! seenBlockDescs.has( trimmed )
		) {
			seenBlockDescs.add( trimmed );
			blockDescRules.push( { from: trimmed, to: target.blockDescription } );
		}
	}

	// 4. Personalized phrases & patterns
	const personalizedPhraseRules = [
		// Block interactive & welcome greetings
		{
			from: 'Welcome to Next-Gen WordPress!',
			to: `Welcome to ${ target.name }!`,
		},
		{
			from: 'Powered by WP AI Ready Plugin Boilerplate.',
			to: `Powered by ${ target.name }.`,
		},
		...( current.name !== target.name
			? [
					{
						from: `Powered by ${ current.name }.`,
						to: `Powered by ${ target.name }.`,
					},
			  ]
			: [] ),

		// Block keywords in block.json
		{ from: '"boilerplate"', to: `"${ target.slug }"` },

		// Block pattern copy
		{
			from: 'Autonomous AI Capabilities',
			to: `${ target.name } Capabilities`,
		},
		{
			from: 'Explore seamless integrations between Gutenberg blocks, WordPress REST API, and AI agent workflows.',
			to: `Explore seamless integrations between Gutenberg blocks, WordPress REST API, and ${ target.name } workflows.`,
		},
		{
			from: 'A modern interactive showcase featuring the Hello World block.',
			to: `A modern interactive showcase featuring the ${ target.blockTitle } block.`,
		},

		// Readme metadata & description
		{
			from: 'Tags: boilerplate, enterprise, modern, ddd, react',
			to: `Tags: ${ target.slug }, enterprise, modern, ddd, react`,
		},
		{
			from: '* Initial enterprise boilerplate release.',
			to: `* Initial release of ${ target.name }.`,
		},
		{
			from: '= Initial enterprise boilerplate release.',
			to: `= Initial release of ${ target.name }.`,
		},
		{
			from: 'Initial enterprise boilerplate release.',
			to: `Initial release of ${ target.name }.`,
		},
		{
			from: 'Yes, this boilerplate requires PHP 8.3 or greater.',
			to: 'Yes, this plugin requires PHP 8.3 or greater.',
		},
		{
			from: 'WP AI Ready Plugin Boilerplate provides a modern, robust architecture for WordPress plugin development. It includes a tripartite app-centric domain model (Framework, Backend, Frontend Bridge), Gutenberg Block API v3 integration with Interactivity API, React 18 admin settings interface built with the WordPress Design System (WPDS), contract-first REST API endpoints, and a comprehensive five-tier testing pyramid.',
			to: `${ target.name } provides a modern, robust architecture for WordPress plugin development. It includes a tripartite app-centric domain model (Framework, Backend, Frontend Bridge), Gutenberg Block API v3 integration with Interactivity API, React 18 admin settings interface built with the WordPress Design System (WPDS), contract-first REST API endpoints, and a comprehensive five-tier testing pyramid.`,
		},
		...( current.name !== 'WP AI Ready Plugin Boilerplate' &&
		current.name !== target.name
			? [
					{
						from: `${ current.name } provides a modern, robust architecture for WordPress plugin development. It includes a tripartite app-centric domain model (Framework, Backend, Frontend Bridge), Gutenberg Block API v3 integration with Interactivity API, React 18 admin settings interface built with the WordPress Design System (WPDS), contract-first REST API endpoints, and a comprehensive five-tier testing pyramid.`,
						to: `${ target.name } provides a modern, robust architecture for WordPress plugin development. It includes a tripartite app-centric domain model (Framework, Backend, Frontend Bridge), Gutenberg Block API v3 integration with Interactivity API, React 18 admin settings interface built with the WordPress Design System (WPDS), contract-first REST API endpoints, and a comprehensive five-tier testing pyramid.`,
					},
			  ]
			: [] ),
	];

	// 5. Compound titles & legacy boilerplate leftovers
	const compoundTitleRules = [
		{
			from: 'WP AI Ready Plugin Boilerplate REST Contract',
			to: `${ target.name } REST Contract`,
		},
		{
			from: 'WordPress AI Boilerplate REST Contract',
			to: `${ target.name } REST Contract`,
		},
		{
			from: 'WP AI Ready Plugin Boilerplate Settings',
			to: `${ target.name } Settings`,
		},
		{
			from: 'Boilerplate Settings',
			to: `${ target.name } Settings`,
		},
		{
			from: 'WordPress AI Boilerplate',
			to: target.name,
		},
		{
			from: 'AI Boilerplate',
			to: target.name,
		},
		{
			from: 'AI-Ready WP Plugin',
			to: target.name,
		},
		{
			from: 'AI-Ready WP',
			to: target.name,
		},
	];

	return [
		// 1. Specific compound identifiers & phrases (longest tokens first)
		...( current.camelPrefix !== target.camelPrefix
			? [
					{
						from: `${ current.camelPrefix }AdminBootstrap`,
						to: `${ target.camelPrefix }AdminBootstrap`,
					},
					{
						from: `_${ current.lowerUnderscorePrefix }manually_load_plugin`,
						to: `_${ target.lowerUnderscorePrefix }manually_load_plugin`,
					},
					{
						from: `_${ current.camelPrefix }_manually_load_plugin`,
						to: `_${ target.camelPrefix }_manually_load_plugin`,
					},
			  ]
			: [] ),
		{
			from: 'airwpSettingsBootstrap',
			to: `${ target.camelPrefix }AdminBootstrap`,
		},
		// Main PHP filename references
		{
			from: current.mainPhpFile,
			to: `${ target.slug }.php`,
		},
		// Dev REST route namespace (e.g. ai-ready-wp-dev/v1 -> wpaibp-dev/v1)
		...( currentDevRestNamespace !== targetDevRestNamespace
			? [ { from: currentDevRestNamespace, to: targetDevRestNamespace } ]
			: [] ),
		// REST route namespace (dynamically discovered, e.g. wpaibp/v1 -> ai-flow/v1)
		{
			from: current.restNamespace,
			to: target.restNamespace,
		},
		// Block identifier (dynamically discovered, e.g. wpaibp/hello-world -> ai-flow/flow-canvas)
		{
			from: current.blockName,
			to: target.blockName,
		},
		// Composer package name (e.g. wordpress-ai/wp-ai-ready-plugin-boilerplate -> flowcraft/ai-flow-automator)
		...( current.composerName &&
		target.composerName &&
		current.composerName !== target.composerName
			? [ { from: current.composerName, to: target.composerName } ]
			: [] ),
		// Descriptions & summaries
		...descriptionRules,
		// Greeting messages
		...greetingRules,
		// Block descriptions
		...blockDescRules,
		// Personalized phrases & patterns
		...personalizedPhraseRules,
		// Compound titles & legacy boilerplate leftovers
		...compoundTitleRules,
		// Exact Plugin Display Name
		{
			from: current.name,
			to: target.name,
		},

		// 2. Specific Identifier Prefixes (MUST precede bare namespace and vendor prefix!)
		// Uppercase Constant Prefix (e.g. WPAIBP_ -> AFA_)
		{
			from: current.prefix,
			to: target.prefix,
		},
		// Lowercase Underscore Prefix (e.g. wpaibp_ -> afa_)
		{
			from: current.lowerUnderscorePrefix,
			to: target.lowerUnderscorePrefix,
		},
		// Lowercase Hyphen Prefix (e.g. wpaibp- -> afa-)
		...( current.lowerHyphenPrefix !== target.lowerHyphenPrefix
			? [
					{
						from: current.lowerHyphenPrefix,
						to: target.lowerHyphenPrefix,
					},
			  ]
			: [] ),
		// PascalCase Prefix (e.g. Wpaibp -> Afa)
		...( current.pascalPrefix !== target.pascalPrefix
			? [ { from: current.pascalPrefix, to: target.pascalPrefix } ]
			: [] ),

		// 3. PHP Namespaces
		// 3a. JSON files require double backslash escaping for namespace strings
		...( current.namespace.includes( '\\' )
			? [
					{
						from: current.namespace.replaceAll( '\\', '\\\\' ),
						to: target.namespace.replaceAll( '\\', '\\\\' ),
						include: [ '.json' ],
					},
			  ]
			: [
					{
						from: `${ current.namespace }\\\\`,
						to: `${ target.namespace.replaceAll( '\\', '\\\\' ) }\\\\`,
						include: [ '.json' ],
					},
			  ] ),
		// 3b. PHP string literals with escaped namespaces (e.g. 'WPAIBP\\Framework\\' in autoload maps)
		...( current.namespace.includes( '\\' )
			? [
					{
						from: `'${ current.namespace.replaceAll( '\\', '\\\\' ) }\\\\`,
						to: `'${ target.namespace.replaceAll( '\\', '\\\\' ) }\\\\`,
					},
			  ]
			: [
					{
						from: `'${ current.namespace }\\\\`,
						to: `'${ target.namespace.replaceAll( '\\', '\\\\' ) }\\\\`,
					},
			  ] ),
		// 3c. Pure PHP / TS / Markdown namespace references (single backslash, non-JSON)
		{
			from: current.namespace,
			to: target.namespace,
			exclude: [ '.json' ],
		},

		// 4. Category / Vendor prefix (bare word in categories/abilities, safe after prefixes are replaced)
		...( current.vendorPrefix !== target.vendorPrefix &&
		current.vendorPrefix !== current.slug
			? [ { from: current.vendorPrefix, to: target.vendorPrefix } ]
			: [] ),

		// 5. WP-CLI root commands
		...( current.cliCommand !== target.cliCommand
			? [
					{
						from: `wp ${ current.cliCommand }`,
						to: `wp ${ target.cliCommand }`,
					},
					{
						from: `WP_CLI::add_command( '${ current.cliCommand }'`,
						to: `WP_CLI::add_command( '${ target.cliCommand }'`,
					},
					{
						from: `WP_CLI::add_command( "${ current.cliCommand }"`,
						to: `WP_CLI::add_command( "${ target.cliCommand }"`,
					},
					{
						from: `WP_CLI::add_command( '${ current.cliCommand } `,
						to: `WP_CLI::add_command( '${ target.cliCommand } `,
					},
					{
						from: `WP_CLI::add_command( "${ current.cliCommand } `,
						to: `WP_CLI::add_command( "${ target.cliCommand } `,
					},
			  ]
			: [] ),
		// Fallback for legacy 'ai-ready' CLI command if current.cliCommand was custom
		...( target.cliCommand !== 'ai-ready' && current.cliCommand !== 'ai-ready'
			? [
					{
						from: 'wp ai-ready',
						to: `wp ${ target.cliCommand }`,
					},
					{
						from: "WP_CLI::add_command( 'ai-ready'",
						to: `WP_CLI::add_command( '${ target.cliCommand }'`,
					},
			  ]
			: [] ),

		// 6. Legacy fallbacks & Text Domain
		{
			from: 'airwp/hello-world',
			to: target.blockName,
		},
		...( target.vendorPrefix !== 'ai-ready-wp'
			? [ { from: 'ai-ready-wp', to: target.vendorPrefix } ]
			: [] ),
		// Slug / Textdomain
		{
			from: current.slug,
			to: target.slug,
		},
		// Author
		...( current.author !== target.author
			? [ { from: current.author, to: target.author } ]
			: [] ),
	];
}
