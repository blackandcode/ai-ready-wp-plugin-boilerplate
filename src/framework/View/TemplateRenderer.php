<?php
/**
 * Safe Template Renderer Implementation.
 *
 * Implements the Template Method & View Strategy design pattern:
 * - Scoped variable extraction.
 * - Path traversal security checks.
 * - Extensibility filters for themes and add-ons (airwp_template_path, airwp_template_data).
 * - Output buffering for string capture.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\View
 */

namespace AIReady\WPPluginBoilerplate\Framework\View;

use InvalidArgumentException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class TemplateRenderer
 */
class TemplateRenderer implements TemplateRendererInterface {

	/**
	 * Base directory containing templates.
	 *
	 * @var string
	 */
	private string $base_dir;

	/**
	 * Singleton instance for static contexts.
	 *
	 * @var TemplateRenderer|null
	 */
	private static ?TemplateRenderer $instance = null;

	/**
	 * Constructor.
	 *
	 * @param string|null $base_dir Optional base directory for templates.
	 */
	public function __construct( ?string $base_dir = null ) {
		if ( null === $base_dir ) {
			$plugin_dir     = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 4 ) . '/';
			$this->base_dir = rtrim( $plugin_dir, '/\\' ) . '/src/frontend/templates/';
		} else {
			$this->base_dir = rtrim( $base_dir, '/\\' ) . '/';
		}
	}

	/**
	 * Retrieve singleton instance.
	 *
	 * @return TemplateRenderer
	 */
	public static function instance(): TemplateRenderer {
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
	 * Resolve the full absolute path of a template with security checks and filters.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return string Absolute template file path.
	 * @throws InvalidArgumentException If template path is invalid or traverses directory boundaries.
	 */
	public function resolve_path( string $template, array $data = array() ): string {
		// Prevent null byte injections and direct directory traversal.
		if ( str_contains( $template, "\0" ) || str_contains( $template, '..' ) ) {
			throw new InvalidArgumentException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception messages are internal diagnostic strings.
				sprintf( 'Security violation: directory traversal detected in template path "%s".', $template )
			);
		}

		$normalized = ltrim( $template, '/\\' );
		if ( ! str_ends_with( $normalized, '.php' ) ) {
			$normalized .= '.php';
		}

		$candidate = $this->base_dir . $normalized;

		// Fallback check 1: check directly under frontend root (e.g. apps/<app>/templates/<template>).
		if ( ! file_exists( $candidate ) ) {
			$frontend_candidate = dirname( $this->base_dir ) . '/' . $normalized;
			if ( file_exists( $frontend_candidate ) ) {
				$candidate = $frontend_candidate;
			}
		}

		// Fallback check 2: if not found, check subdirectories under templates (e.g. admin/<template>).
		if ( ! file_exists( $candidate ) && ! str_contains( $normalized, '/' ) ) {
			$admin_candidate = $this->base_dir . 'admin/' . $normalized;
			if ( file_exists( $admin_candidate ) ) {
				$candidate = $admin_candidate;
			}
		}

		// Apply external filter for template path override.
		if ( function_exists( 'apply_filters' ) ) {
			/**
			 * Filter the resolved template path.
			 *
			 * @param string               $candidate Template path candidate.
			 * @param string               $template  Original requested template name.
			 * @param array<string, mixed> $data      Template variables.
			 */
			$candidate = (string) apply_filters( 'airwp_template_path', $candidate, $template, $data );
		}

		if ( ! file_exists( $candidate ) ) {
			throw new InvalidArgumentException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception messages are internal diagnostic strings.
				sprintf( 'Template file "%s" does not exist at resolved path "%s".', $template, $candidate )
			);
		}

		return $candidate;
	}

	/**
	 * Render a template file directly to output.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return void
	 * @throws InvalidArgumentException If template cannot be resolved.
	 */
	public function render( string $template, array $data = array() ): void {
		$file = $this->resolve_path( $template, $data );

		if ( function_exists( 'apply_filters' ) ) {
			/**
			 * Filter template data before extraction.
			 *
			 * @param array<string, mixed> $data     Template variables.
			 * @param string               $template Original template name.
			 */
			$data = (array) apply_filters( 'airwp_template_data', $data, $template );
		}

		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract -- Controlled template variable scope isolation.
		extract( $data, EXTR_SKIP );

		include $file;
	}

	/**
	 * Render a template and return its output as a string.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return string Evaluated markup.
	 * @throws InvalidArgumentException If template cannot be resolved.
	 */
	public function render_to_string( string $template, array $data = array() ): string {
		ob_start();

		try {
			$this->render( $template, $data );
			return (string) ob_get_clean();
		} catch ( InvalidArgumentException $e ) {
			ob_end_clean();
			throw $e;
		}
	}
}
