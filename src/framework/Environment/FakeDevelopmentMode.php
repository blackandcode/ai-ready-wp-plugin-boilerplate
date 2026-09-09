<?php
/**
 * In-Memory Fake Development Mode Adapter for Testing.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Environment
 */

namespace AIReady\WPPluginBoilerplate\Framework\Environment;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Test double allowing deterministic control of development mode state without modifying wp-config.php.
 */
final class FakeDevelopmentMode implements DevelopmentMode {

	/**
	 * Whether plugin development mode is active.
	 *
	 * @var bool
	 */
	private bool $is_dev;

	/**
	 * Active mode string.
	 *
	 * @var string
	 */
	private string $mode;

	/**
	 * Constructor.
	 *
	 * @param bool   $is_dev Whether plugin development mode is active.
	 * @param string $mode   Optional specific mode string ('all', 'plugin', etc.).
	 */
	public function __construct( bool $is_dev = false, string $mode = '' ) {
		$this->is_dev = $is_dev;
		$this->mode   = '' !== $mode ? $mode : ( $is_dev ? 'plugin' : '' );
	}

	/**
	 * Determine whether plugin development mode is active.
	 *
	 * @return bool
	 */
	public function is_plugin_development(): bool {
		return $this->is_dev;
	}

	/**
	 * Get active development mode string.
	 *
	 * @return string
	 */
	public function get_mode(): string {
		return $this->mode;
	}

	/**
	 * Mutate development mode state in tests.
	 *
	 * @param bool   $is_dev Whether plugin development mode is active.
	 * @param string $mode   Optional specific mode string.
	 * @return void
	 */
	public function set_development( bool $is_dev, string $mode = '' ): void {
		$this->is_dev = $is_dev;
		$this->mode   = '' !== $mode ? $mode : ( $is_dev ? 'plugin' : '' );
	}
}
