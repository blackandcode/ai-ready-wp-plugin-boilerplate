<?php
/**
 * Settings WP-CLI Command.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Cli
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Cli;

use Throwable;
use WP_CLI;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\SettingsApplicationService;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Manage settings configuration via WP-CLI.
 */
class SettingsCliCommand {

	/**
	 * Settings application service.
	 *
	 * @var SettingsApplicationService|null
	 */
	private ?SettingsApplicationService $service = null;

	/**
	 * Constructor.
	 *
	 * @param SettingsApplicationService|null $service Optional service.
	 */
	public function __construct( ?SettingsApplicationService $service = null ) {
		$this->service = $service;
	}

	/**
	 * Get settings application service.
	 *
	 * @return SettingsApplicationService
	 */
	private function get_settings_service(): SettingsApplicationService {
		if ( null !== $this->service ) {
			return $this->service;
		}

		$container = Plugin::instance()->get_container();
		if ( $container && $container->has( SettingsApplicationService::class ) ) {
			return $container->get( SettingsApplicationService::class );
		}

		$repo       = new \AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure\WordPressSettingsRepository();
		$dispatcher = new \AIReady\WPPluginBoilerplate\Framework\Event\EventDispatcher();
		return new SettingsApplicationService( $repo, $dispatcher );
	}

	/**
	 * Retrieve plugin settings.
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
}
