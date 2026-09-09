<?php
/**
 * Title: Feature Callout Card
 * Slug: ai-ready-wp/card-feature
 * Categories: ai-ready-wp, featured
 * Description: A clean callout card featuring an icon badge and headline.
 *
 * @package AIReady\WPPluginBoilerplate
 */

?>
<!-- wp:group {"className":"airwp-feature-card","layout":{"type":"constrained"}} -->
<div class="wp-block-group airwp-feature-card">
	<!-- wp:heading {"level":3} -->
	<h3 class="wp-block-heading"><?php esc_html_e( 'Autonomous AI Capabilities', 'ai-ready-wp-plugin-boilerplate' ); ?></h3>
	<!-- /wp:heading -->
	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'Explore seamless integrations between Gutenberg blocks, WordPress REST API, and AI agent workflows.', 'ai-ready-wp-plugin-boilerplate' ); ?></p>
	<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
