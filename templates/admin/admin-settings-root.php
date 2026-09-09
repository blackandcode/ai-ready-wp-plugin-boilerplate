<?php
/**
 * Admin Settings Root Mount Template.
 *
 * @package AIReady\WPPluginBoilerplate\Admin
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
		if ( isset( $renderer ) && $renderer instanceof \AIReady\WPPluginBoilerplate\Support\View\TemplateRendererInterface ) {
			$renderer->render( 'partials/app-loading.php' );
		} else {
			?>
			<p class="airwp-app-loading"><?php esc_html_e( 'Loading settings application...', 'ai-ready-wp-plugin-boilerplate' ); ?></p>
			<?php
		}
		?>
	</div>
</div>
