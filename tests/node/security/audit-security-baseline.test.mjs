import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
	checkSuperglobals,
	checkTemplateEscaping,
	checkWpdbPreparedQueries,
	checkRestPermissions,
	auditSecurityBaseline,
} from '../../../tools/security/audit-security-baseline.mjs';

const testDir = dirname( fileURLToPath( import.meta.url ) );
const projectRoot = resolve( testDir, '../../..' );
const cliPath = join( projectRoot, 'tools/security/audit-security-baseline.mjs' );

test( 'checkSuperglobals detects forbidden wholesale access and direct echo', () => {
	const wholesaleSnippet = '<?php $all = $_POST;\nforeach ( $_GET as $k => $v ) {}';
	const violations = checkSuperglobals( 'test.php', wholesaleSnippet );
	assert.equal( violations.length, 2 );
	assert.match( violations[ 0 ].message, /Wholesale superglobal access forbidden/ );

	const directEchoSnippet = "<?php echo $_POST['message'];";
	const echoViolations = checkSuperglobals( 'test.php', directEchoSnippet );
	assert.equal( echoViolations.length, 1 );
	assert.match( echoViolations[ 0 ].message, /Direct output of superglobal forbidden/ );

	const safeSnippet = "<?php $val = isset( $_POST['val'] ) ? sanitize_text_field( wp_unslash( $_POST['val'] ) ) : '';";
	const safeViolations = checkSuperglobals( 'test.php', safeSnippet );
	assert.equal( safeViolations.length, 0 );
} );

test( 'checkTemplateEscaping flags unescaped variables in template paths', () => {
	const unescapedTemplate = '<?php echo $raw_value; ?>';
	const templateViolations = checkTemplateEscaping(
		'src/frontend/apps/settings/templates/custom.php',
		unescapedTemplate
	);
	assert.equal( templateViolations.length, 1 );
	assert.match( templateViolations[ 0 ].message, /Unescaped variable output/ );

	const escapedTemplate = '<?php echo esc_html( $raw_value ); ?>';
	const cleanViolations = checkTemplateEscaping(
		'src/frontend/apps/settings/templates/custom.php',
		escapedTemplate
	);
	assert.equal( cleanViolations.length, 0 );

	// Non-template paths should not be evaluated by template escaping check
	const nonTemplateViolations = checkTemplateEscaping(
		'src/backend/Apps/Settings/SettingsBackendServiceProvider.php',
		unescapedTemplate
	);
	assert.equal( nonTemplateViolations.length, 0 );
} );

test( 'checkWpdbPreparedQueries flags unprepared dynamic queries', () => {
	const unpreparedSnippet = '<?php $wpdb->query( "DELETE FROM table WHERE id = " . $id );';
	const violations = checkWpdbPreparedQueries( 'test.php', unpreparedSnippet );
	assert.equal( violations.length, 1 );
	assert.match( violations[ 0 ].message, /without \$wpdb->prepare\(\) is forbidden/ );

	const preparedSnippet = '<?php $wpdb->query( $wpdb->prepare( "DELETE FROM table WHERE id = %d", $id ) );';
	const cleanViolations = checkWpdbPreparedQueries( 'test.php', preparedSnippet );
	assert.equal( cleanViolations.length, 0 );
} );

test( 'checkRestPermissions flags missing permission_callback in register_rest_route', () => {
	const insecureRoute = `<?php
register_rest_route( 'my-plugin/v1', '/data', array(
	'methods' => 'GET',
	'callback' => 'my_callback',
) );
`;
	const violations = checkRestPermissions( 'test.php', insecureRoute );
	assert.equal( violations.length, 1 );
	assert.match( violations[ 0 ].message, /missing explicit permission_callback/ );

	const secureRoute = `<?php
register_rest_route( 'my-plugin/v1', '/data', array(
	'methods' => 'GET',
	'callback' => 'my_callback',
	'permission_callback' => '__return_true',
) );
`;
	const cleanViolations = checkRestPermissions( 'test.php', secureRoute );
	assert.equal( cleanViolations.length, 0 );
} );

test( 'auditSecurityBaseline passes on clean boilerplate codebase', async () => {
	const result = await auditSecurityBaseline( projectRoot );
	assert.equal( result.valid, true );
	assert.equal( result.violations.length, 0 );
	assert.ok( result.scannedCount > 50 );
} );

test( 'CLI displays help and handles options', () => {
	const res = spawnSync( process.execPath, [ cliPath, '--help' ], {
		encoding: 'utf-8',
	} );
	assert.equal( res.status, 0 );
	assert.match( res.stdout, /WordPress Plugin Security Baseline Audit/ );
	assert.match( res.stdout, /--root/ );
	assert.match( res.stdout, /--json/ );
} );
