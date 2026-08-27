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
			$attribute_key = 0 === strpos( $key, 'attribute_' ) ? $key : 'attribute_' . sanitize_title( $key );
			$variation[ sanitize_key( $attribute_key ) ] = sanitize_title( $value );
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
