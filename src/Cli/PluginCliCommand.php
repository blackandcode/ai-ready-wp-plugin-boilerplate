<?php
/**
 * WP-CLI Command Adapter for AI-Ready WP Plugin.
 *
 * @package AIReady\WPPluginBoilerplate\Cli
 */

namespace AIReady\WPPluginBoilerplate\Cli;

use Throwable;
use WP_CLI;
use AIReady\WPPluginBoilerplate\Bootstrap\Plugin;
use AIReady\WPPluginBoilerplate\Diagnostics\Application\DiagnosticsService;
use AIReady\WPPluginBoilerplate\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Settings\Application\SettingsApplicationService;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Manage plugin configuration and inspect diagnostic telemetry via WP-CLI.
 */
class PluginCliCommand {

	/**
	 * Retrieve plugin settings.
	 *
	 * ## OPTIONS
	 *
	 * [--format=<format>]
	 * : Render output in a specific format.
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
	 *     wp ai-ready settings get
	 *     wp ai-ready settings get --format=json
	 *
	 * @subcommand settings-get
	 *
	 * @param array<int, string>   $args Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function settings_get( array $args, array $assoc_args ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$service = $this->get_settings_service();
		$dto     = $service->get_settings();
		$raw     = $dto->to_array();

		$format = $assoc_args['format'] ?? 'table';

		if ( 'table' === $format ) {
			$rows = array(
				array(
					'Section' => 'General',
					'Key'     => 'greeting_message',
					'Value'   => $raw['general']['greeting_message'],
				),
				array(
					'Section' => 'General',
					'Key'     => 'enable_feature',
					'Value'   => $raw['general']['enable_feature'] ? 'true' : 'false',
				),
				array(
					'Section' => 'General',
					'Key'     => 'description',
					'Value'   => $raw['general']['description'],
				),
				array(
					'Section' => 'Advanced',
					'Key'     => 'rest_debug',
					'Value'   => $raw['advanced']['rest_debug'] ? 'true' : 'false',
				),
				array(
					'Section' => 'Advanced',
					'Key'     => 'cache_ttl',
					'Value'   => (string) $raw['advanced']['cache_ttl'],
				),
				array(
					'Section' => 'Data Retention',
					'Key'     => 'uninstall_action',
					'Value'   => $raw['data_retention']['uninstall_action'],
				),
			);
			WP_CLI\Utils\format_items( 'table', $rows, array( 'Section', 'Key', 'Value' ) );
			return;
		}

		WP_CLI\Utils\format_items( $format, array( $raw ), array_keys( $raw ) );
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
	public function settings_update( array $args, array $assoc_args ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$service = $this->get_settings_service();

		$greeting   = isset( $assoc_args['greeting'] ) ? (string) $assoc_args['greeting'] : null;
		$feature    = isset( $assoc_args['enable-feature'] ) ? filter_var( $assoc_args['enable-feature'], FILTER_VALIDATE_BOOLEAN ) : null;
		$desc       = isset( $assoc_args['description'] ) ? (string) $assoc_args['description'] : null;
		$rest_debug = isset( $assoc_args['rest-debug'] ) ? filter_var( $assoc_args['rest-debug'], FILTER_VALIDATE_BOOLEAN ) : null;
		$ttl        = isset( $assoc_args['cache-ttl'] ) ? (int) $assoc_args['cache-ttl'] : null;
		$action     = isset( $assoc_args['uninstall-action'] ) ? (string) $assoc_args['uninstall-action'] : null;

		$command = new UpdateSettingsCommand(
			$greeting,
			$feature,
			$desc,
			$rest_debug,
			$ttl,
			$action
		);

		try {
			$service->update_settings( $command );
			WP_CLI::success( 'Plugin settings updated successfully.' );
		} catch ( Throwable $e ) {
			WP_CLI::error( 'Failed to update settings: ' . $e->getMessage() );
		}
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
	public function doctor( array $args, array $assoc_args ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$service     = $this->get_diagnostics_service();
		$diagnostics = $service->get_diagnostics()->to_array();

		$format = $assoc_args['format'] ?? 'table';

		if ( 'table' === $format ) {
			$rows = array();
			foreach ( $diagnostics as $metric => $val ) {
				$rows[] = array(
					'Metric' => $metric,
					'Status' => $val,
				);
			}
			WP_CLI\Utils\format_items( 'table', $rows, array( 'Metric', 'Status' ) );
			return;
		}

		WP_CLI\Utils\format_items( $format, array( $diagnostics ), array_keys( $diagnostics ) );
	}

	/**
	 * Resolve SettingsApplicationService from DI container.
	 *
	 * @return SettingsApplicationService
	 */
	private function get_settings_service(): SettingsApplicationService {
		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( SettingsApplicationService::class ) ) {
			return $container->get( SettingsApplicationService::class );
		}
		// Fallback for isolated CLI execution.
		$repo       = new \AIReady\WPPluginBoilerplate\Settings\Infrastructure\WordPressSettingsRepository();
		$dispatcher = new \AIReady\WPPluginBoilerplate\Event\EventDispatcher();
		return new SettingsApplicationService( $repo, $dispatcher );
	}

	/**
	 * Resolve DiagnosticsService from DI container.
	 *
	 * @return DiagnosticsService
	 */
	private function get_diagnostics_service(): DiagnosticsService {
		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( DiagnosticsService::class ) ) {
			return $container->get( DiagnosticsService::class );
		}
		$provider = new \AIReady\WPPluginBoilerplate\Diagnostics\Infrastructure\WordPressDiagnosticsProvider();
		return new DiagnosticsService( $provider );
	}
}
