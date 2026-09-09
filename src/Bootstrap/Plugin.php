<?php
/**
 * Main plugin bootstrap class.
 *
 * @package AIReady\WPPluginBoilerplate\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Bootstrap;

use AIReady\WPPluginBoilerplate\Abilities\AbilitiesServiceProvider;
use AIReady\WPPluginBoilerplate\Admin\AdminServiceProvider;
use AIReady\WPPluginBoilerplate\Block\BlockServiceProvider;
use AIReady\WPPluginBoilerplate\Cli\CliServiceProvider;
use AIReady\WPPluginBoilerplate\Rest\RestServiceProvider;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Singleton bootstrap class for AI-Ready WP Plugin Boilerplate.
 */
class Plugin {

	/**
	 * Plugin version.
	 */
	public const VERSION = '1.0.1';

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static ?Plugin $instance = null;

	/**
	 * Whether the plugin has been booted.
	 *
	 * @var bool
	 */
	private bool $booted = false;

	/**
	 * DI Container.
	 *
	 * @var Container|null
	 */
	private ?Container $container = null;

	/**
	 * Service Provider Registry.
	 *
	 * @var ServiceProviderRegistry|null
	 */
	private ?ServiceProviderRegistry $registry = null;

	/**
	 * Get singleton instance.
	 *
	 * @return Plugin
	 */
	public static function instance(): Plugin {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Private constructor.
	 */
	private function __construct() {}

	/**
	 * Boot the plugin services.
	 */
	public function boot(): void {
		if ( $this->booted ) {
			return;
		}

		if ( ! Compatibility::check() ) {
			return;
		}

		$this->booted = true;

		if ( function_exists( 'add_action' ) ) {
			add_action( 'init', array( $this, 'on_init' ) );
		}
	}

	/**
	 * WordPress init hook callback.
	 */
	public function on_init(): void {
		if ( null !== $this->container ) {
			return;
		}

		$this->container = new Container();
		$this->registry  = new ServiceProviderRegistry( $this->container );

		$this->registry->add_provider( new RestServiceProvider() );
		$this->registry->add_provider( new AdminServiceProvider() );
		$this->registry->add_provider( new BlockServiceProvider() );
		$this->registry->add_provider( new CliServiceProvider() );
		$this->registry->add_provider( new AbilitiesServiceProvider() );

		$this->registry->register_all();
		$this->registry->boot_all();
	}

	/**
	 * Check if plugin is booted.
	 *
	 * @return bool
	 */
	public function is_booted(): bool {
		return $this->booted;
	}

	/**
	 * Get the DI container.
	 *
	 * @return Container|null
	 */
	public function get_container(): ?Container {
		return $this->container;
	}

	/**
	 * Get the service provider registry.
	 *
	 * @return ServiceProviderRegistry|null
	 */
	public function get_registry(): ?ServiceProviderRegistry {
		return $this->registry;
	}

	/**
	 * Reset singleton instance for testing purposes.
	 *
	 * @return void
	 */
	public static function reset_instance(): void {
		self::$instance = null;
	}
}
