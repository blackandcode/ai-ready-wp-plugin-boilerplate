<?php
/**
 * Service Provider Registry.
 *
 * @package AIReady\WPPluginBoilerplate\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Bootstrap;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Manages registration and booting of service providers.
 */
class ServiceProviderRegistry {

	/**
	 * DI Container.
	 *
	 * @var Container
	 */
	private Container $container;

	/**
	 * List of registered service providers.
	 *
	 * @var ServiceProvider[]
	 */
	private array $providers = array();

	/**
	 * Whether services have been registered.
	 *
	 * @var bool
	 */
	private bool $registered = false;

	/**
	 * Whether services have been booted.
	 *
	 * @var bool
	 */
	private bool $booted = false;

	/**
	 * Constructor.
	 *
	 * @param Container $container DI container.
	 */
	public function __construct( Container $container ) {
		$this->container = $container;
	}

	/**
	 * Add a service provider to the registry.
	 *
	 * @param ServiceProvider $provider Service provider instance.
	 * @return self
	 */
	public function add_provider( ServiceProvider $provider ): self {
		$this->providers[] = $provider;

		if ( $this->registered ) {
			$provider->register( $this->container );
		}

		if ( $this->booted ) {
			$provider->boot();
		}

		return $this;
	}

	/**
	 * Register all providers with the container.
	 *
	 * @return void
	 */
	public function register_all(): void {
		if ( $this->registered ) {
			return;
		}

		foreach ( $this->providers as $provider ) {
			$provider->register( $this->container );
		}

		$this->registered = true;
	}

	/**
	 * Boot all registered providers.
	 *
	 * @return void
	 */
	public function boot_all(): void {
		if ( $this->booted ) {
			return;
		}

		if ( ! $this->registered ) {
			$this->register_all();
		}

		foreach ( $this->providers as $provider ) {
			$provider->boot();
		}

		$this->booted = true;
	}

	/**
	 * Get the container.
	 *
	 * @return Container
	 */
	public function get_container(): Container {
		return $this->container;
	}

	/**
	 * Get list of providers.
	 *
	 * @return ServiceProvider[]
	 */
	public function get_providers(): array {
		return $this->providers;
	}
}
