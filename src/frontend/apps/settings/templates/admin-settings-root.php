<?php
/**
 * Admin Settings Root Mount Template.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Apps\Settings\Templates
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap airwp-admin-wrap">
	<h1 class="wp-heading-inline"><?php esc_html_e( 'AI-Ready WP Plugin Boilerplate Settings', 'ai-ready-wp-plugin-boilerplate' ); ?></h1>
	<hr class="wp-header-end">
	<div id="airwp-settings-root" class="airwp-app-root">
		<?php
		/**
		 * Fires inside the Settings app root container before React mounts.
		 *
		 * Enables rendering placeholder loading states or fallback notices via hooks.
		 */
		do_action( 'airwp_settings_app_placeholder' );
		?>
	</div>
</div>
