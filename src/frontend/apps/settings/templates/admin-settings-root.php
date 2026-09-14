<?php
/**
 * Admin Settings Root Mount Template.
 *
 * @package WPAIBP\Frontend\Apps\Settings\Templates
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap wpaibp-admin-wrap">
	<h1 class="wp-heading-inline"><?php esc_html_e( 'WP AI Ready Plugin Boilerplate Settings', 'wp-ai-ready-plugin-boilerplate' ); ?></h1>
	<hr class="wp-header-end">
	<div id="wpaibp-settings-root" class="wpaibp-app-root">
		<?php
		/**
		 * Fires inside the Settings app root container before React mounts.
		 *
		 * Enables rendering placeholder loading states or fallback notices via hooks.
		 */
		do_action( 'wpaibp_settings_app_placeholder' );
		?>
	</div>
</div>
