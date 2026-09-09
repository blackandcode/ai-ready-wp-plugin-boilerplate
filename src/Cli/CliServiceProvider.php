<?php
/**
 * WP-CLI Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Cli
 */

namespace AIReady\WPPluginBoilerplate\Cli;

use WP_CLI;
use AIReady\WPPluginBoilerplate\Bootstrap\Container;
use AIReady\WPPluginBoilerplate\Bootstrap\ServiceProvider;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider registering WP-CLI commands when running in CLI context.
 */
class CliServiceProvider implements ServiceProvider {

	/**
	 * Register services in container.
	 *
	 * @param Container $container Container instance.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// CLI commands are resolved lazily on command execution.
	}

	/**
	 * Boot WP-CLI commands.
	 *
	 * @return void
	 */
	public function boot(): void {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			WP_CLI::add_command( 'ai-ready', PluginCliCommand::class );
		}
	}
}
