<?php
/**
 * Main plugin bootstrap class.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Kernel
 */

namespace AIReady\WPPluginBoilerplate\Framework\Kernel;

use AIReady\WPPluginBoilerplate\Backend\BackendServiceProvider;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderRegistry;
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
	public const VERSION = '1.1.2';

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

		// Register backend (headless apps) and frontend (UI bridge) providers.
		if ( class_exists( BackendServiceProvider::class ) ) {
			$this->registry->add_provider( new BackendServiceProvider() );
		}

		if ( class_exists( FrontendServiceProvider::class ) ) {
			$this->registry->add_provider( new FrontendServiceProvider() );
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
}
