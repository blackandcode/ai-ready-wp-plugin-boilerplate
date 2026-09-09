import assert from 'node:assert/strict';
import test from 'node:test';
import {
	compilePattern,
	isPathIgnored,
	loadDistignore,
	parseDistignore,
} from '../../../tools/release/lib/distignore.mjs';

test( 'compilePattern creates correct regexes for anchored and wildcard rules', () => {
	const rule1 = compilePattern( '/.git' );
	assert.equal( rule1.anchored, true );
	assert.equal( rule1.regex.test( '.git' ), true );
	assert.equal( rule1.regex.test( '.git/config' ), true );
	assert.equal( rule1.regex.test( 'sub/.git' ), false );

	const rule2 = compilePattern( '*.zip' );
	assert.equal( rule2.anchored, false );
	assert.equal( rule2.regex.test( 'test.zip' ), true );
	assert.equal( rule2.regex.test( 'dist/test.zip' ), true );
	assert.equal( rule2.regex.test( 'test.txt' ), false );
} );

test( 'parseDistignore skips empty lines and comments', () => {
	const content = `
# This is a comment
/.git
/docs/

# Another comment
*.log
`;
	const patterns = parseDistignore( content );
	assert.equal( patterns.length, 3 );
} );

test( 'isPathIgnored correctly flags ignored and non-ignored project files', () => {
	const rules = parseDistignore( `
/.git
/.github
/.cursor
/docs
/tests
/tools
/node_modules
/.wp-env
/package.json
/composer.json
*.zip
.distignore
` );

	// Should be ignored
	assert.equal( isPathIgnored( '.git/HEAD', false, rules ), true );
	assert.equal(
		isPathIgnored( '.github/workflows/ci.yml', false, rules ),
		true
	);
	assert.equal(
		isPathIgnored( '.cursor/rules/some.mdc', false, rules ),
		true
	);
	assert.equal(
		isPathIgnored(
			'docs/devops/releasing-and-distribution.md',
			false,
			rules
		),
		true
	);
	assert.equal( isPathIgnored( 'tests/node/test.mjs', false, rules ), true );
	assert.equal(
		isPathIgnored( 'tools/release/build.mjs', false, rules ),
		true
	);
	assert.equal(
		isPathIgnored( 'node_modules/react/index.js', false, rules ),
		true
	);
	assert.equal( isPathIgnored( 'package.json', false, rules ), true );
	assert.equal( isPathIgnored( 'composer.json', false, rules ), true );
	assert.equal( isPathIgnored( '.distignore', false, rules ), true );
	assert.equal( isPathIgnored( 'dist/my-plugin.zip', false, rules ), true );

	// Must NOT be ignored
	assert.equal(
		isPathIgnored( 'ai-ready-wp-plugin-boilerplate.php', false, rules ),
		false
	);
	assert.equal(
		isPathIgnored( 'src/framework/Kernel/Plugin.php', false, rules ),
		false
	);
	assert.equal(
		isPathIgnored( 'src/backend/Apps/Settings/Settings.php', false, rules ),
		false
	);
	assert.equal( isPathIgnored( 'build/index.js', false, rules ), false );
	assert.equal(
		isPathIgnored( 'build/index.asset.php', false, rules ),
		false
	);
	assert.equal( isPathIgnored( 'vendor/autoload.php', false, rules ), false );
	assert.equal(
		isPathIgnored( 'vendor/composer/autoload_psr4.php', false, rules ),
		false
	);
	assert.equal( isPathIgnored( 'readme.txt', false, rules ), false );
	assert.equal( isPathIgnored( 'uninstall.php', false, rules ), false );
} );

test( 'isPathIgnored correctly flags development subsystem and config files with production rules', async () => {
	const rules = await loadDistignore( process.cwd() );

	// Development subsystem & uncompiled frontend files must be ignored
	assert.equal(
		isPathIgnored( 'src/development/Cli/OpenApiCliCommand.php', false, rules ),
		true
	);
	assert.equal(
		isPathIgnored( 'src/frontend/apps/settings/react/App.tsx', false, rules ),
		true
	);
	assert.equal(
		isPathIgnored( 'src/frontend/shared/index.ts', false, rules ),
		true
	);
	assert.equal(
		isPathIgnored( 'build/admin/developer/index.js', false, rules ),
		true
	);

	// Root dev configs must be ignored
	assert.equal( isPathIgnored( 'blueprint.json', false, rules ), true );
	assert.equal( isPathIgnored( 'redocly.yaml', false, rules ), true );
	assert.equal( isPathIgnored( 'wp-cli.yml', false, rules ), true );
	assert.equal( isPathIgnored( 'README.md', false, rules ), true );
	assert.equal( isPathIgnored( 'vendor/bin/phpunit', false, rules ), true );
	assert.equal(
		isPathIgnored( 'build/admin/settings/index.js.map', false, rules ),
		true
	);

	// Runtime files must NOT be ignored
	assert.equal(
		isPathIgnored( 'ai-ready-wp-plugin-boilerplate.php', false, rules ),
		false
	);
	assert.equal(
		isPathIgnored( 'src/framework/Kernel/Plugin.php', false, rules ),
		false
	);
	assert.equal(
		isPathIgnored( 'build/admin/settings/index.js', false, rules ),
		false
	);
	assert.equal(
		isPathIgnored( 'build/blocks-manifest.php', false, rules ),
		false
	);
} );
