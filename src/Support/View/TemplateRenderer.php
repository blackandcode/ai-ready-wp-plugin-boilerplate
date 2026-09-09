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
 * @package AIReady\WPPluginBoilerplate\Support\View
 */

namespace AIReady\WPPluginBoilerplate\Support\View;

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
			$plugin_dir     = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 3 ) . '/';
			$this->base_dir = rtrim( $plugin_dir, '/\\' ) . '/templates/';
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

		// Fallback check: if not found, check subdirectories (e.g. templates/admin/<template>).
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
				sprintf( 'Template file "%s" does not exist in "%s".', $template, $this->base_dir )
			);
		}

		return $candidate;
	}

	/**
	 * Render a template file directly to standard output.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return void
	 */
	public function render( string $template, array $data = array() ): void {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Template output buffer contains validated template markup.
		echo $this->render_to_string( $template, $data );
	}

	/**
	 * Render a template file and capture its evaluated output as a string.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return string Evaluated template markup.
	 * @throws \Throwable If template resolution or rendering fails.
	 */
	public function render_to_string( string $template, array $data = array() ): string {
		$template_path = $this->resolve_path( $template, $data );

		// Apply external filter for template data.
		if ( function_exists( 'apply_filters' ) ) {
			/**
			 * Filter the data passed to the template.
			 *
			 * @param array<string, mixed> $data     Template variables.
			 * @param string               $template Template name.
			 */
			$data = (array) apply_filters( 'airwp_template_data', $data, $template );
		}

		// Ensure $renderer is accessible in template scope for partial nesting.
		$renderer = $this; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Injected into template scope.

		ob_start();
		try {
			// phpcs:ignore WordPress.PHP.DontExtract.extract_extract -- Extracting isolated template context variables in scoped render method.
			extract( $data, EXTR_SKIP );
			include $template_path;
		} catch ( \Throwable $e ) {
			ob_end_clean();
			throw $e;
		}

		return (string) ob_get_clean();
	}
}
