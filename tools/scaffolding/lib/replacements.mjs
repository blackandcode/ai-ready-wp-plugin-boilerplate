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
		// 1. Double backslash namespace (JSON files)
		{
			from: current.namespace.replaceAll( '\\', '\\\\' ),
			to: target.namespace.replaceAll( '\\', '\\\\' ),
		},
		// 2. Single backslash namespace (PHP / TS / Docs)
		{
			from: current.namespace,
			to: target.namespace,
		},
		// 3. Main PHP filename references
		{
			from: current.mainPhpFile,
			to: `${ target.slug }.php`,
		},
		// 4. Descriptions & summaries
		...descriptionRules,
		// 5. Greeting messages
		...greetingRules,
		// 6. Block descriptions
		...blockDescRules,
		// 7. Personalized phrases & patterns
		...personalizedPhraseRules,
		// 8. Compound titles & legacy boilerplate leftovers
		...compoundTitleRules,
		// 9. Exact Plugin Display Name
		{
			from: current.name,
			to: target.name,
		},
		// 10. Dev REST route namespace (e.g. ai-ready-wp-dev/v1 -> wpaibp-dev/v1)
		...( currentDevRestNamespace !== targetDevRestNamespace
			? [ { from: currentDevRestNamespace, to: targetDevRestNamespace } ]
			: [] ),
		// 11. REST route namespace (dynamically discovered)
		{
			from: current.restNamespace,
			to: target.restNamespace,
		},
		// 12. Block identifier (dynamically discovered)
		{
			from: current.blockName,
			to: target.blockName,
		},
		// 13. Category / Vendor prefix (e.g. ai-ready-wp -> wpaibp)
		...( current.vendorPrefix !== target.vendorPrefix &&
		current.vendorPrefix !== current.slug
			? [ { from: current.vendorPrefix, to: target.vendorPrefix } ]
			: [] ),
		// 14. Composer package name
		...( current.composerName &&
		target.composerName &&
		current.composerName !== target.composerName
			? [ { from: current.composerName, to: target.composerName } ]
			: [] ),
		// 15. Uppercase Constant Prefix
		{
			from: current.prefix,
			to: target.prefix,
		},
		// 16. Lowercase Underscore Prefix (e.g. wpaibp_ -> wpaibp_)
		{
			from: current.lowerUnderscorePrefix,
			to: target.lowerUnderscorePrefix,
		},
		// 17. Lowercase Hyphen Prefix (e.g. wpaibp- -> wpaibp-)
		...( current.lowerHyphenPrefix !== target.lowerHyphenPrefix
			? [
					{
						from: current.lowerHyphenPrefix,
						to: target.lowerHyphenPrefix,
					},
			  ]
			: [] ),
		// 18. PascalCase Prefix (e.g. WpaibpBootstrapData -> WpaibpBootstrapData)
		...( current.pascalPrefix !== target.pascalPrefix
			? [ { from: current.pascalPrefix, to: target.pascalPrefix } ]
			: [] ),
		// 19. CamelCase Global Bootstrap variable (e.g. wpaibpAdminBootstrap -> wpaibpAdminBootstrap)
		...( current.camelPrefix !== target.camelPrefix
			? [
					{
						from: `${ current.camelPrefix }AdminBootstrap`,
						to: `${ target.camelPrefix }AdminBootstrap`,
					},
			  ]
			: [] ),
		// 20. WP-CLI root commands
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
		// 21. Legacy fallbacks
		{
			from: 'airwp/hello-world',
			to: target.blockName,
		},
		{
			from: 'airwpSettingsBootstrap',
			to: `${ target.camelPrefix }AdminBootstrap`,
		},
		...( target.vendorPrefix !== 'ai-ready-wp'
			? [ { from: 'ai-ready-wp', to: target.vendorPrefix } ]
			: [] ),
		// 22. Slug / Textdomain
		{
			from: current.slug,
			to: target.slug,
		},
		// 23. Author
		...( current.author !== target.author
			? [ { from: current.author, to: target.author } ]
			: [] ),
	];
}
