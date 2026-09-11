<?php
/**
 * Plugin Name: Screwnet Domain Config
 * Description: Keeps the headless WordPress backend canonical URL on wp.screwnet.in.
 * Version: 1.0.0
 * Author: Screwnet
 */

defined( 'ABSPATH' ) || exit;

const SCREWNET_BACKEND_URL = 'https://wp.screwnet.in';

add_action( 'init', function () {
	if ( get_option( 'siteurl' ) !== SCREWNET_BACKEND_URL ) {
		update_option( 'siteurl', SCREWNET_BACKEND_URL );
	}

	if ( get_option( 'home' ) !== SCREWNET_BACKEND_URL ) {
		update_option( 'home', SCREWNET_BACKEND_URL );
	}
}, 1 );

