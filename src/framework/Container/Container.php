<?php
/**
 * Lightweight Dependency Injection Container.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Container
 */

namespace AIReady\WPPluginBoilerplate\Framework\Container;

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
	 * @template T
	 * @param class-string<T>|string $id Service or interface name.
	 * @return ($id is class-string<T> ? T : mixed)
	 * @throws RuntimeException If service is not registered.
	 */
	public function get( string $id ): mixed {
		if ( array_key_exists( $id, $this->instances ) ) {
			return $this->instances[ $id ];
		}

		if ( ! array_key_exists( $id, $this->bindings ) ) {
			throw new RuntimeException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception messages are internal diagnostic strings.
				sprintf( 'Service "%s" is not registered in the container.', $id )
			);
		}

		$instance               = call_user_func( $this->bindings[ $id ], $this );
		$this->instances[ $id ] = $instance;

		return $instance;
	}

	/**
	 * Check if a service is bound in the container.
	 *
	 * @param string $id Service or interface name.
	 * @return bool
	 */
	public function has( string $id ): bool {
		return array_key_exists( $id, $this->bindings ) || array_key_exists( $id, $this->instances );
	}

	/**
	 * Flush all bindings and instances (primarily for testing).
	 *
	 * @return void
	 */
	public function flush(): void {
		$this->bindings  = array();
		$this->instances = array();
	}
}
