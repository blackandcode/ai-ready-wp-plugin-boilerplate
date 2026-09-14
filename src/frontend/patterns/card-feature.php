<?php
/**
 * Title: Feature Callout Card
 * Slug: wpaibp/card-feature
 * Categories: ai-ready-wp, featured
 * Description: A clean callout card featuring an icon badge and headline.
 *
 * @package WPAIBP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<!-- wp:group {"className":"wpaibp-feature-card","layout":{"type":"constrained"}} -->
<div class="wp-block-group wpaibp-feature-card">
	<!-- wp:heading {"level":3} -->
	<h3 class="wp-block-heading"><?php esc_html_e( 'Autonomous AI Capabilities', 'wp-ai-ready-plugin-boilerplate' ); ?></h3>
	<!-- /wp:heading -->
	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'Explore seamless integrations between Gutenberg blocks, WordPress REST API, and AI agent workflows.', 'wp-ai-ready-plugin-boilerplate' ); ?></p>
	<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
