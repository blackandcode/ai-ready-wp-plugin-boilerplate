<?php
/**
 * Plugin Uninstall Handler.
 *
 * @package AIReady\WPPluginBoilerplate
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Perform uninstall cleanup based on configured data retention policy.
 */
function airwp_uninstall_plugin(): void {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	$settings = get_option( 'airwp_settings', array() );
	$policy   = $settings['data_retention']['uninstall_action'] ?? 'preserve';

	if ( 'preserve' === $policy ) {
		return;
	}

	if ( in_array( $policy, array( 'delete_settings', 'delete_all' ), true ) ) {
		delete_option( 'airwp_settings' );
		delete_option( 'airwp_version' );
	}
}

if ( is_multisite() ) {
	$airwp_sites = get_sites( array( 'fields' => 'ids' ) );
	foreach ( $airwp_sites as $airwp_site_id ) {
		switch_to_blog( $airwp_site_id );
		airwp_uninstall_plugin();
		restore_current_blog();
	}
} else {
	airwp_uninstall_plugin();
}
