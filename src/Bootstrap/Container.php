<?php
/**
 * Lightweight Dependency Injection Container.
 *
 * @package AIReady\WPPluginBoilerplate\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Bootstrap;

use RuntimeException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Minimal purpose-built DI container for AI-Ready WP Plugin Boilerplate.
 */
class Container {

	/**
	 * Map of service IDs to factories/callables or instances.
	 *
	 * @var array<string, callable>
	 */
	private array $bindings = array();

	/**
	 * Map of resolved singleton instances.
	 *
	 * @var array<string, mixed>
	 */
	private array $instances = array();

	/**
	 * Bind a service ID to a factory callable (singleton by default).
	 *
	 * @param string   $id      Service or interface name.
	 * @param callable $factory Factory function that accepts Container and returns the service.
	 * @return void
	 */
	public function bind( string $id, callable $factory ): void {
		$this->bindings[ $id ] = $factory;
		unset( $this->instances[ $id ] );
	}

	/**
	 * Bind an existing instance to a service ID.
	 *
	 * @param string $id       Service or interface name.
	 * @param mixed  $instance Instantiated object or value.
	 * @return void
	 */
	public function instance( string $id, mixed $instance ): void {
		$this->instances[ $id ] = $instance;
	}

	/**
	 * Get a service by ID.
	 *
	 * @param string $id Service ID or class name.
	 * @return mixed
	 * @throws RuntimeException If service is not bound.
	 */
	public function get( string $id ): mixed {
		if ( array_key_exists( $id, $this->instances ) ) {
			return $this->instances[ $id ];
		}

		if ( isset( $this->bindings[ $id ] ) ) {
			$service                = call_user_func( $this->bindings[ $id ], $this );
			$this->instances[ $id ] = $service;
			return $service;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
		throw new RuntimeException( sprintf( 'Service "%s" is not registered in the container.', $id ) );
	}

	/**
	 * Check if a service ID is bound or instantiated.
	 *
	 * @param string $id Service ID or class name.
	 * @return bool
	 */
	public function has( string $id ): bool {
		return isset( $this->bindings[ $id ] ) || array_key_exists( $id, $this->instances );
	}
}
