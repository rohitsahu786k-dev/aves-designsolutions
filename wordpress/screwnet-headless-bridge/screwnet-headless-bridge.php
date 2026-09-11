<?php
/**
 * Plugin Name: Screwnet Headless Commerce Bridge
 * Description: Transfers Next.js cart to WooCommerce, handles contact enquiries, and exposes FiboSearch headless REST API.
 * Version: 1.1.0
 * Author: Screwnet Technical Fasteners
 */

defined( 'ABSPATH' ) || exit;

// 1. Cart Handoff to WooCommerce Checkout
add_action( 'template_redirect', function () {
	if ( empty( $_GET['screwnet_cart_handoff'] ) ) {
		return;
	}

	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		wp_die( esc_html__( 'WooCommerce cart is unavailable.', 'screwnet-headless-bridge' ) );
	}

	$encoded = sanitize_text_field( wp_unslash( $_GET['screwnet_cart_handoff'] ) );
	if ( strlen( $encoded ) > 12000 ) {
		wp_die( esc_html__( 'Cart request is too large.', 'screwnet-headless-bridge' ) );
	}

	$encoded .= str_repeat( '=', ( 4 - strlen( $encoded ) % 4 ) % 4 );
	$payload = json_decode( base64_decode( strtr( $encoded, '-_', '+/' ), true ), true );
	if ( ! is_array( $payload ) || empty( $payload['items'] ) || ! is_array( $payload['items'] ) ) {
		wp_die( esc_html__( 'Cart request is invalid.', 'screwnet-headless-bridge' ) );
	}

	WC()->cart->empty_cart();
	foreach ( array_slice( $payload['items'], 0, 50 ) as $item ) {
		$product_id   = absint( $item['product_id'] ?? 0 );
		$variation_id = absint( $item['variation_id'] ?? 0 );
		$quantity     = min( 999, max( 1, absint( $item['quantity'] ?? 1 ) ) );
		$product      = wc_get_product( $variation_id ?: $product_id );
		if ( ! $product || ! $product->is_purchasable() || ! $product->is_in_stock() ) {
			continue;
		}

		$variation = array();
		foreach ( (array) ( $item['variation'] ?? array() ) as $key => $value ) {
			if ( is_array( $value ) ) {
				$raw_key   = $value['taxonomy'] ?? $value['name'] ?? $key;
				$raw_value = $value['value'] ?? $value['option'] ?? '';
			} else {
				$raw_key   = $key;
				$raw_value = $value;
			}
			if ( '' === $raw_value ) {
				continue;
			}
			$attribute_key = 0 === strpos( $raw_key, 'attribute_' ) ? $raw_key : 'attribute_' . sanitize_title( $raw_key );
			$variation[ sanitize_key( $attribute_key ) ] = sanitize_title( $raw_value );
		}
		WC()->cart->add_to_cart( $product_id, $quantity, $variation_id, $variation );
	}

	if ( ! empty( $payload['coupon'] ) ) {
		WC()->cart->apply_coupon( wc_format_coupon_code( sanitize_text_field( $payload['coupon'] ) ) );
	}
	WC()->cart->calculate_totals();

	$target = ( $payload['redirect'] ?? '' ) === 'checkout' ? wc_get_checkout_url() : wc_get_cart_url();
	wp_safe_redirect( $target );
	exit;
}, 5 );

add_filter( 'woocommerce_email_footer_text', function () {
	return 'screwnet | Industrial Fasteners, Screws, Bolts & Hardware | Udaipur, Rajasthan';
} );

// 2. REST API Routes (Contact & FiboSearch)
add_action( 'rest_api_init', function () {
	// Contact Form Enquiry
	register_rest_route( 'screwnet/v1', '/contact', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$name    = sanitize_text_field( $request->get_param( 'name' ) );
			$email   = sanitize_email( $request->get_param( 'email' ) );
			$phone   = sanitize_text_field( $request->get_param( 'phone' ) );
			$query   = sanitize_text_field( $request->get_param( 'query' ) );
			$subject = sanitize_text_field( $request->get_param( 'subject' ) );
			$message = sanitize_textarea_field( $request->get_param( 'message' ) );
			if ( ! $name || ! is_email( $email ) || ! $subject || strlen( $message ) < 10 ) {
				return new WP_Error( 'invalid_enquiry', 'Please complete all required fields.', array( 'status' => 400 ) );
			}
			$body = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;border:1px solid #dedbd4"><div style="background:#0f172a;color:#fff;padding:24px"><h1 style="font-size:22px;font-weight:700;margin:0">New Fastener Enquiry - screwnet</h1></div><div style="padding:24px;color:#222;line-height:1.65"><p><strong style="color:#ea580c">' . esc_html( $query ) . '</strong></p><p><b>Name:</b> ' . esc_html( $name ) . '<br><b>Email:</b> ' . esc_html( $email ) . '<br><b>Phone:</b> ' . esc_html( $phone ) . '</p><h2 style="font-size:17px;font-weight:600">' . esc_html( $subject ) . '</h2><p>' . nl2br( esc_html( $message ) ) . '</p></div></div>';
			$headers = array( 'Content-Type: text/html; charset=UTF-8', 'Reply-To: ' . $name . ' <' . $email . '>' );
			$sent = wp_mail( get_option( 'admin_email' ), '[screwnet Fasteners Enquiry] ' . $subject, $body, $headers );
			return $sent ? rest_ensure_response( array( 'sent' => true ) ) : new WP_Error( 'mail_failed', 'Email could not be sent.', array( 'status' => 500 ) );
		},
	) );

	// FiboSearch Live Endpoint for Headless Next.js
	register_rest_route( 'screwnet/v1', '/fibosearch', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$phrase = sanitize_text_field( $request->get_param( 's' ) ?: $request->get_param( 'q' ) ?: '' );
			if ( strlen( $phrase ) < 2 ) {
				return rest_ensure_response( array( 'suggestions' => array(), 'total' => 0 ) );
			}

			$results = array();

			// A. Query using FiboSearch Search Engine if available
			if ( class_exists( '\\DgoraWcas\\Search' ) ) {
				$fibo = new \DgoraWcas\Search();
				$fibo_res = $fibo->searchPosts( $phrase, array(
					'post_type' => 'product',
					'fields'    => 'ids',
					'per_page'  => 10,
				) );
				if ( ! is_wp_error( $fibo_res ) && ! empty( $fibo_res['results'] ) ) {
					foreach ( $fibo_res['results'] as $product_id ) {
						$product = wc_get_product( $product_id );
						if ( ! $product || ! $product->is_visible() ) {
							continue;
						}
						$image_id = $product->get_image_id();
						$results[] = array(
							'id'       => $product->get_id(),
							'label'    => $product->get_name(),
							'type'     => 'product',
							'href'     => '/product/' . $product->get_slug(),
							'sku'      => $product->get_sku(),
							'price'    => $product->get_price(),
							'image'    => $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : '',
							'engine'   => 'fibosearch',
						);
					}
				}
			}

			// B. Fallback to WooCommerce Native Products if FiboSearch returned no IDs
			if ( empty( $results ) && function_exists( 'wc_get_products' ) ) {
				$products = wc_get_products( array(
					'status'  => 'publish',
					'limit'   => 8,
					's'       => $phrase,
				) );
				foreach ( $products as $product ) {
					$image_id = $product->get_image_id();
					$results[] = array(
						'id'     => $product->get_id(),
						'label'  => $product->get_name(),
						'type'   => 'product',
						'href'   => '/product/' . $product->get_slug(),
						'sku'    => $product->get_sku(),
						'price'  => $product->get_price(),
						'image'  => $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : '',
						'engine' => 'wc_native',
					);
				}
			}

			// C. Also find matching categories
			$categories = get_terms( array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => true,
				'name__like' => $phrase,
				'number'     => 4,
			) );
			if ( ! is_wp_error( $categories ) ) {
				foreach ( $categories as $cat ) {
					$thumb_id = get_term_meta( $cat->term_id, 'thumbnail_id', true );
					$results[] = array(
						'id'     => $cat->term_id,
						'label'  => $cat->name,
						'type'   => 'category',
						'href'   => '/category/' . $cat->slug,
						'sku'    => '',
						'price'  => '',
						'image'  => $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'thumbnail' ) : '',
						'count'  => $cat->count,
						'engine' => 'taxonomy',
					);
				}
			}

			return rest_ensure_response( array(
				'suggestions' => $results,
				'total'       => count( $results ),
				'source'      => 'fibosearch',
			) );
		},
	) );
} );

// =========================================================================
// 3. FRONTEND REDIRECT TO WP-LOGIN (No public storefront on wp.screwnet.in)
// =========================================================================
add_action( 'template_redirect', function () {
	// Skip if running in WP admin, AJAX, CRON, or REST API
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}

	$request_uri = $_SERVER['REQUEST_URI'] ?? '';
	if ( false !== strpos( $request_uri, '/wp-json' ) || false !== strpos( $request_uri, 'rest_route' ) ) {
		return;
	}

	// Skip if cart handoff parameter is present
	if ( ! empty( $_GET['screwnet_cart_handoff'] ) ) {
		return;
	}

	// If logged in, redirect to admin dashboard
	if ( is_user_logged_in() ) {
		wp_safe_redirect( admin_url() );
		exit;
	}

	// Otherwise, redirect frontend visitors directly to WordPress Login
	wp_safe_redirect( wp_login_url() );
	exit;
}, 1 );

// =========================================================================
// 4. CUSTOM SCREWNET BRANDING ON LOGIN PAGE & ADMIN BAR
// =========================================================================

// A. Replace WordPress Logo with Screwnet Brand Logo on wp-login.php
add_action( 'login_enqueue_scripts', function () {
	?>
	<style type="text/css">
		body.login {
			background-color: #0f172a !important;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
		}
		#login {
			padding-top: 5% !important;
		}
		#login h1 a, .login h1 a {
			background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 70"><rect width="320" height="70" rx="8" fill="%230f172a"/><g transform="translate(15, 12)"><circle cx="23" cy="23" r="21" fill="%23f97316"/><path d="M14 23h18M23 14v18" stroke="%23ffffff" stroke-width="4" stroke-linecap="round"/><circle cx="23" cy="23" r="12" fill="none" stroke="%230f172a" stroke-width="2.5"/></g><text x="75" y="44" font-family="Montserrat, -apple-system, sans-serif" font-weight="900" font-size="32" fill="%23ffffff" letter-spacing="-0.5">screw<tspan fill="%23f97316">net</tspan><tspan font-size="18" fill="%2394a3b8">.in</tspan></text></svg>') !important;
			height: 70px !important;
			width: 320px !important;
			background-size: contain !important;
			background-repeat: no-repeat !important;
			background-position: center !important;
			margin-bottom: 25px !important;
		}
		.login form {
			background: #ffffff !important;
			border: 1px solid #e2e8f0 !important;
			border-radius: 12px !important;
			box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25) !important;
			padding: 28px 24px !important;
		}
		.login label {
			font-weight: 600 !important;
			color: #334155 !important;
		}
		.login input[type="text"],
		.login input[type="password"] {
			border: 1px solid #cbd5e1 !important;
			border-radius: 6px !important;
			padding: 8px 12px !important;
		}
		.login input[type="text"]:focus,
		.login input[type="password"]:focus {
			border-color: #f97316 !important;
			box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
		}
		.wp-core-ui .button-primary {
			background: #f97316 !important;
			border-color: #ea580c !important;
			color: #ffffff !important;
			text-shadow: none !important;
			box-shadow: none !important;
			border-radius: 6px !important;
			font-weight: 700 !important;
			padding: 4px 18px !important;
		}
		.wp-core-ui .button-primary:hover {
			background: #ea580c !important;
		}
		.login #nav a, .login #backtoblog a {
			color: #94a3b8 !important;
		}
		.login #nav a:hover, .login #backtoblog a:hover {
			color: #f97316 !important;
		}
	</style>
	<?php
} );

// B. Link login logo to main storefront screwnet.in
add_filter( 'login_headerurl', function () {
	return 'https://screwnet.in';
} );

// C. Change logo hover title text
add_filter( 'login_headertext', function () {
	return 'screwnet | Industrial Fasteners & Screws';
} );

// D. Remove WordPress logo node from top admin bar
add_action( 'admin_bar_menu', function ( $wp_admin_bar ) {
	$wp_admin_bar->remove_node( 'wp-logo' );
}, 999 );

// E. Custom admin footer note
add_filter( 'admin_footer_text', function () {
	return '<span id="footer-thankyou">screwnet Store Backend &bull; <a href="https://screwnet.in" target="_blank" rel="noopener noreferrer">View Live Storefront (screwnet.in)</a></span>';
} );

