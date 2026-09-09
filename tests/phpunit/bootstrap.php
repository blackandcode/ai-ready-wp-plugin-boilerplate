<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package AIReady\WPPluginBoilerplate\Tests
 */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', sys_get_temp_dir() . '/' );
}

if ( file_exists( dirname( __DIR__, 2 ) . '/vendor/autoload.php' ) ) {
	require_once dirname( __DIR__, 2 ) . '/vendor/autoload.php';
}

// Fallback PSR-4 autoloader for running tests without vendor/autoload.php.
spl_autoload_register(
	static function ( $class ) {
		$map = array(
			'AIReady\\WPPluginBoilerplate\\Framework\\'   => dirname( __DIR__, 2 ) . '/src/framework/',
			'AIReady\\WPPluginBoilerplate\\Backend\\'     => dirname( __DIR__, 2 ) . '/src/backend/',
			'AIReady\\WPPluginBoilerplate\\Development\\' => dirname( __DIR__, 2 ) . '/src/development/',
			'AIReady\\WPPluginBoilerplate\\Frontend\\'    => dirname( __DIR__, 2 ) . '/src/frontend/Bridge/',
		);

		foreach ( $map as $prefix => $base_dir ) {
			$len = strlen( $prefix );
			if ( strncmp( $prefix, $class, $len ) === 0 ) {
				$relative_class = substr( $class, $len );
				$file           = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

				if ( file_exists( $file ) ) {
					require_once $file;
					return;
				}
			}
		}
	}
);

$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	require_once $_tests_dir . '/includes/functions.php';

	function _airwp_manually_load_plugin() {
		require_once dirname( __DIR__, 2 ) . '/ai-ready-wp-plugin-boilerplate.php';
	}
	tests_add_filter( 'muplugins_loaded', '_airwp_manually_load_plugin' );

	require $_tests_dir . '/includes/bootstrap.php';
}
