<?php
/**
 * Main plugin bootstrap class.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Kernel
 */

namespace AIReady\WPPluginBoilerplate\Framework\Kernel;

use AIReady\WPPluginBoilerplate\Backend\BackendServiceProvider;
use AIReady\WPPluginBoilerplate\Development\DevelopmentServiceProvider;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderRegistry;
use AIReady\WPPluginBoilerplate\Framework\Environment\DevelopmentMode;
use AIReady\WPPluginBoilerplate\Framework\Environment\WordPressDevelopmentMode;
use AIReady\WPPluginBoilerplate\Frontend\FrontendServiceProvider;

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
	public const VERSION = '1.3.2';

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
	 * Development mode adapter.
	 *
	 * @var DevelopmentMode|null
	 */
	private ?DevelopmentMode $development_mode = null;

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
	 * Reset singleton instance (primarily for testing).
	 *
	 * @return void
	 */
	public static function reset_instance(): void {
		self::$instance = null;
	}

	/**
	 * Private constructor.
	 */
	private function __construct() {}

	/**
	 * Boot the plugin services.
	 *
	 * @param DevelopmentMode|null $development_mode Optional development mode override.
	 * @return void
	 */
	public function boot( ?DevelopmentMode $development_mode = null ): void {
		if ( null !== $development_mode ) {
			$this->development_mode = $development_mode;
		}

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

		if ( null === $this->development_mode ) {
			$this->development_mode = new WordPressDevelopmentMode();
		}

		$this->container->instance( DevelopmentMode::class, $this->development_mode );
		$this->registry = new ServiceProviderRegistry( $this->container );

		// Register runtime providers.
		$this->registry->add_provider( new BackendServiceProvider() );
		$this->registry->add_provider( new FrontendServiceProvider() );

		// Conditionally register development provider when plugin development mode is active.
		if ( $this->development_mode->is_plugin_development() ) {
			$this->registry->add_provider( new DevelopmentServiceProvider() );
		}

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
	 * Get DI container.
	 *
	 * @return Container|null
	 */
	public function get_container(): ?Container {
		return $this->container;
	}

	/**
	 * Get service provider registry.
	 *
	 * @return ServiceProviderRegistry|null
	 */
	public function get_registry(): ?ServiceProviderRegistry {
		return $this->registry;
	}

	/**
	 * Get the development mode instance.
	 *
	 * @return DevelopmentMode|null
	 */
	public function get_development_mode(): ?DevelopmentMode {
		return $this->development_mode;
	}

	/**
	 * Set the development mode instance (primarily for testing).
	 *
	 * @param DevelopmentMode $development_mode Development mode instance.
	 * @return void
	 */
	public function set_development_mode( DevelopmentMode $development_mode ): void {
		$this->development_mode = $development_mode;
	}
}
