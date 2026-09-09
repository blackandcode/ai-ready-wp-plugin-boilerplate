<?php
/**
 * Developer WP-CLI Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Development\Cli
 */

namespace AIReady\WPPluginBoilerplate\Development\Cli;

use WP_CLI;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers development-only WP-CLI commands.
 */
class DeveloperCliServiceProvider implements ServiceProviderInterface {

	/**
	 * Register CLI services in DI container.
	 *
	 * @param Container $container Container instance.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// No container bindings required for CLI commands.
	}

	/**
	 * Boot CLI commands if running in WP-CLI environment.
	 *
	 * @return void
	 */
	public function boot(): void {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			WP_CLI::add_command( 'ai-ready openapi', OpenApiCliCommand::class );
		}
	}
}
