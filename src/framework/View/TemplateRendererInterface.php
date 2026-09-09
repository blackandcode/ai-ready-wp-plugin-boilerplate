<?php
/**
 * Template Renderer Contract.
 *
 * Defines the contract for isolated, safe template rendering.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\View
 */

namespace AIReady\WPPluginBoilerplate\Framework\View;

use InvalidArgumentException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface TemplateRendererInterface
 */
interface TemplateRendererInterface {

	/**
	 * Render a template file directly to standard output.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return void
	 */
	public function render( string $template, array $data = array() ): void;

	/**
	 * Render a template file and capture its evaluated output as a string.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return string Evaluated template markup.
	 */
	public function render_to_string( string $template, array $data = array() ): string;

	/**
	 * Resolve the full absolute path of a template with security checks and filters.
	 *
	 * @param string               $template Relative template path/name.
	 * @param array<string, mixed> $data     Template context variables.
	 * @return string Absolute template file path.
	 * @throws InvalidArgumentException If template path is invalid or traverses directory boundaries.
	 */
	public function resolve_path( string $template, array $data = array() ): string;
}
