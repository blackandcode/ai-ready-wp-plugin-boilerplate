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
function wpaibp_uninstall_plugin(): void {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	global $wpdb;

	$settings = get_option( 'wpaibp_settings', array() );
	$policy   = $settings['data_retention']['uninstall_action'] ?? 'preserve';

	if ( 'preserve' === $policy ) {
		return;
	}

	if ( in_array( $policy, array( 'delete_settings', 'delete_all' ), true ) ) {
		delete_option( 'wpaibp_settings' );
		delete_option( 'wpaibp_version' );
	}

	if ( 'delete_all' === $policy && isset( $wpdb ) ) {
		// Clean up any cached transients prefixed with wpaibp_.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_wpaibp_' ) . '%',
				$wpdb->esc_like( '_transient_timeout_wpaibp_' ) . '%'
			)
		);
	}
}

if ( is_multisite() ) {
	$wpaibp_sites = get_sites( array( 'fields' => 'ids' ) );
	foreach ( $wpaibp_sites as $wpaibp_site_id ) {
		switch_to_blog( $wpaibp_site_id );
		wpaibp_uninstall_plugin();
		restore_current_blog();
	}
} else {
	wpaibp_uninstall_plugin();
}
