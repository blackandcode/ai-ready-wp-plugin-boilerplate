<?php
/**
 * Service Provider Registry.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Container
 */

namespace AIReady\WPPluginBoilerplate\Framework\Container;

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
	 * @var ServiceProviderInterface[]
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
	 * @param ServiceProviderInterface $provider Service provider instance.
	 * @return self
	 */
	public function add_provider( ServiceProviderInterface $provider ): self {
		$this->providers[] = $provider;
		return $this;
	}

	/**
	 * Register all providers into container.
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
	 * Boot all providers.
	 *
	 * @return void
	 */
	public function boot_all(): void {
		if ( $this->booted ) {
			return;
		}

		foreach ( $this->providers as $provider ) {
			$provider->boot();
		}

		$this->booted = true;
	}

	/**
	 * Get all registered providers.
	 *
	 * @return ServiceProviderInterface[]
	 */
	public function get_providers(): array {
		return $this->providers;
	}

	/**
	 * Reset registry state (for testing).
	 *
	 * @return void
	 */
	public function reset(): void {
		$this->providers  = array();
		$this->registered = false;
		$this->booted     = false;
	}
}
