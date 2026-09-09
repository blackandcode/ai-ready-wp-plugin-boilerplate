<?php
/**
 * Master WP-CLI Command Adapter for AI-Ready WP Plugin.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Cli
 */

namespace AIReady\WPPluginBoilerplate\Backend\Cli;

use WP_CLI;
use AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Cli\DiagnosticsCliCommand;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Cli\SettingsCliCommand;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Manage plugin configuration and inspect diagnostic telemetry via WP-CLI.
 */
class PluginCliCommand {

	/**
	 * Settings command delegate.
	 *
	 * @var SettingsCliCommand
	 */
	private SettingsCliCommand $settings_cli;

	/**
	 * Diagnostics command delegate.
	 *
	 * @var DiagnosticsCliCommand
	 */
	private DiagnosticsCliCommand $diagnostics_cli;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->settings_cli    = new SettingsCliCommand();
		$this->diagnostics_cli = new DiagnosticsCliCommand();
	}

	/**
	 * Retrieve plugin settings.
	 *
	 * ## OPTIONS
	 *
	 * [--format=<format>]
	 * : Render output in a specific format (table, json, yaml).
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - json
	 *   - yaml
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     wp ai-ready settings-get
	 *     wp ai-ready settings-get --format=json
	 *
	 * @subcommand settings-get
	 *
	 * @param array<int, string>   $args Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function settings_get( array $args, array $assoc_args ): void {
		$this->settings_cli->settings_get( $args, $assoc_args );
	}

	/**
	 * Update plugin settings.
	 *
	 * ## OPTIONS
	 *
	 * [--greeting=<greeting>]
	 * : Greeting message.
	 *
	 * [--enable-feature=<bool>]
	 * : Enable feature toggle (true/false).
	 *
	 * [--description=<description>]
	 * : Plugin description text.
	 *
	 * [--rest-debug=<bool>]
	 * : REST API debugging flag (true/false).
	 *
	 * [--cache-ttl=<seconds>]
	 * : Cache TTL in seconds (0 to 86400).
	 *
	 * [--uninstall-action=<action>]
	 * : Data retention policy on uninstall (preserve, delete_settings, delete_all).
	 *
	 * ## EXAMPLES
	 *
	 *     wp ai-ready settings-update --greeting="Welcome to my site"
	 *     wp ai-ready settings-update --cache-ttl=7200 --enable-feature=true
	 *
	 * @subcommand settings-update
	 *
	 * @param array<int, string>   $args Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function settings_update( array $args, array $assoc_args ): void {
		$this->settings_cli->settings_update( $args, $assoc_args );
	}

	/**
	 * Inspect plugin runtime diagnostic telemetry.
	 *
	 * ## OPTIONS
	 *
	 * [--format=<format>]
	 * : Output format (table, json, yaml).
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - json
	 *   - yaml
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     wp ai-ready doctor
	 *     wp ai-ready doctor --format=json
	 *
	 * @param array<int, string>   $args Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function doctor( array $args, array $assoc_args ): void {
		$this->diagnostics_cli->doctor( $args, $assoc_args );
	}

	/**
	 * Print plugin release version.
	 *
	 * ## EXAMPLES
	 *
	 *     wp ai-ready version
	 *
	 * @param array<int, string>   $args Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function version( array $args, array $assoc_args ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable, Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		$version = defined( 'AIRWP_VERSION' ) ? AIRWP_VERSION : Plugin::VERSION;
		WP_CLI::line( $version );
	}
}
