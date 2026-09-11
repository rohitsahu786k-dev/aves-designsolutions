<?php
/**
 * Plugin Name: Screwnet Headless Commerce Bridge
 * Description: Transfers Next.js cart to WooCommerce, handles contact enquiries, exposes FiboSearch headless REST API, and powers headless Customer Account portal.
 * Version: 1.2.0
 * Author: Screwnet Technical Fasteners
 */

defined( 'ABSPATH' ) || exit;

// =========================================================================
// 0. TOKEN & AUTH HELPERS
// =========================================================================

function screwnet_generate_customer_token( $user_id ) {
	$user = get_user_by( 'id', $user_id );
	if ( ! $user ) {
		return '';
	}
	$timestamp = time();
	$secret    = defined( 'AUTH_KEY' ) ? AUTH_KEY : 'screwnet_headless_secret_key_2026';
	$signature = hash_hmac( 'sha256', $user_id . '|' . $timestamp . '|' . substr( $user->user_pass, 0, 12 ), $secret );
	return base64_encode( $user_id . '.' . $timestamp . '.' . $signature );
}

function screwnet_verify_customer_token( $token ) {
	if ( empty( $token ) ) {
		return false;
	}
	$raw = base64_decode( $token, true );
	if ( ! $raw ) {
		return false;
	}
	$parts = explode( '.', $raw );
	if ( count( $parts ) !== 3 ) {
		return false;
	}
	list( $user_id, $timestamp, $signature ) = $parts;
	$user = get_user_by( 'id', absint( $user_id ) );
	if ( ! $user ) {
		return false;
	}
	// 60 days expiration
	if ( ( time() - (int) $timestamp ) > 60 * 86400 ) {
		return false;
	}
	$secret   = defined( 'AUTH_KEY' ) ? AUTH_KEY : 'screwnet_headless_secret_key_2026';
	$expected = hash_hmac( 'sha256', $user_id . '|' . $timestamp . '|' . substr( $user->user_pass, 0, 12 ), $secret );
	if ( ! hash_equals( $expected, $signature ) ) {
		return false;
	}
	return $user;
}

function screwnet_get_customer_from_request( WP_REST_Request $request ) {
	$auth_header = $request->get_header( 'authorization' ) ?: $request->get_header( 'x-customer-token' ) ?: '';
	$token       = '';
	if ( preg_match( '/Bearer\s+(.*)$/i', $auth_header, $matches ) ) {
		$token = trim( $matches[1] );
	} else {
		$token = $request->get_param( 'token' ) ?: $auth_header;
	}
	if ( empty( $token ) ) {
		return false;
	}
	return screwnet_verify_customer_token( $token );
}

function screwnet_format_customer_data( WP_User $user ) {
	$user_id = $user->ID;
	$billing = array(
		'first_name' => get_user_meta( $user_id, 'billing_first_name', true ) ?: $user->first_name,
		'last_name'  => get_user_meta( $user_id, 'billing_last_name', true ) ?: $user->last_name,
		'company'    => get_user_meta( $user_id, 'billing_company', true ) ?: '',
		'address_1'  => get_user_meta( $user_id, 'billing_address_1', true ) ?: '',
		'address_2'  => get_user_meta( $user_id, 'billing_address_2', true ) ?: '',
		'city'       => get_user_meta( $user_id, 'billing_city', true ) ?: '',
		'state'      => get_user_meta( $user_id, 'billing_state', true ) ?: '',
		'postcode'   => get_user_meta( $user_id, 'billing_postcode', true ) ?: '',
		'country'    => get_user_meta( $user_id, 'billing_country', true ) ?: 'IN',
		'email'      => get_user_meta( $user_id, 'billing_email', true ) ?: $user->user_email,
		'phone'      => get_user_meta( $user_id, 'billing_phone', true ) ?: '',
	);

	$shipping = array(
		'first_name' => get_user_meta( $user_id, 'shipping_first_name', true ) ?: $user->first_name,
		'last_name'  => get_user_meta( $user_id, 'shipping_last_name', true ) ?: $user->last_name,
		'company'    => get_user_meta( $user_id, 'shipping_company', true ) ?: '',
		'address_1'  => get_user_meta( $user_id, 'shipping_address_1', true ) ?: '',
		'address_2'  => get_user_meta( $user_id, 'shipping_address_2', true ) ?: '',
		'city'       => get_user_meta( $user_id, 'shipping_city', true ) ?: '',
		'state'      => get_user_meta( $user_id, 'shipping_state', true ) ?: '',
		'postcode'   => get_user_meta( $user_id, 'shipping_postcode', true ) ?: '',
		'country'    => get_user_meta( $user_id, 'shipping_country', true ) ?: 'IN',
		'phone'      => get_user_meta( $user_id, 'shipping_phone', true ) ?: '',
	);

	$order_count = 0;
	if ( function_exists( 'wc_get_orders' ) ) {
		$orders      = wc_get_orders( array(
			'customer_id' => $user_id,
			'limit'       => -1,
			'return'      => 'ids',
		) );
		$order_count = is_array( $orders ) ? count( $orders ) : 0;
	}

	return array(
		'id'           => $user_id,
		'email'        => $user->user_email,
		'first_name'   => $user->first_name,
		'last_name'    => $user->last_name,
		'display_name' => $user->display_name ?: ( $user->first_name ? trim( $user->first_name . ' ' . $user->last_name ) : $user->user_email ),
		'billing'      => $billing,
		'shipping'     => $shipping,
		'order_count'  => $order_count,
		'date_created' => $user->user_registered,
	);
}

function screwnet_format_order_data( WC_Order $order ) {
	$items = array();
	foreach ( $order->get_items() as $item_id => $item ) {
		$product   = $item->get_product();
		$image_url = '';
		if ( $product && $product->get_image_id() ) {
			$image_url = wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ) ?: '';
		}
		$items[] = array(
			'id'       => $item_id,
			'name'     => $item->get_name(),
			'quantity' => $item->get_quantity(),
			'subtotal' => (float) $item->get_subtotal(),
			'total'    => (float) $item->get_total(),
			'image'    => $image_url,
			'slug'     => $product ? $product->get_slug() : '',
		);
	}

	return array(
		'id'             => $order->get_id(),
		'number'         => $order->get_order_number(),
		'status'         => $order->get_status(),
		'status_name'    => function_exists( 'wc_get_order_status_name' ) ? wc_get_order_status_name( $order->get_status() ) : ucfirst( $order->get_status() ),
		'date'           => $order->get_date_created() ? $order->get_date_created()->date( 'Y-m-d H:i:s' ) : '',
		'total'          => (float) $order->get_total(),
		'currency'       => $order->get_currency(),
		'payment_method' => $order->get_payment_method_title(),
		'shipping_total' => (float) $order->get_shipping_total(),
		'billing'        => $order->get_address( 'billing' ),
		'shipping'       => $order->get_address( 'shipping' ),
		'line_items'     => $items,
		'item_count'     => $order->get_item_count(),
	);
}


// =========================================================================
// 1. CORS HEADERS FOR HEADLESS FRONTEND
// =========================================================================
add_action( 'rest_api_init', function () {
	add_action( 'rest_pre_serve_request', function ( $served ) {
		$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
		header( 'Access-Control-Allow-Origin: ' . ( '*' === $origin ? '*' : $origin ) );
		header( 'Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE' );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-Customer-Token, X-WP-Nonce' );
		if ( 'OPTIONS' === ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) {
			status_header( 200 );
			exit;
		}
		return $served;
	}, 10 );
} );


// =========================================================================
// 2. CART HANDOFF
// =========================================================================
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


// =========================================================================
// 3. REST API ROUTES (Contact, FiboSearch, and Headless Auth)
// =========================================================================
add_action( 'rest_api_init', function () {

	// Contact Form
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

	// FiboSearch
	register_rest_route( 'screwnet/v1', '/fibosearch', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$phrase = sanitize_text_field( $request->get_param( 's' ) ?: $request->get_param( 'q' ) ?: '' );
			if ( strlen( $phrase ) < 2 ) {
				return rest_ensure_response( array( 'suggestions' => array(), 'total' => 0 ) );
			}

			$results = array();

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

	// =========================================================================
	// HEADLESS CUSTOMER AUTH ENDPOINTS
	// =========================================================================

	// A. Customer Login
	register_rest_route( 'screwnet/v1', '/auth/login', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$username = sanitize_text_field( $request->get_param( 'username' ) ?: $request->get_param( 'email' ) );
			$password = (string) $request->get_param( 'password' );

			if ( empty( $username ) || empty( $password ) ) {
				return new WP_Error( 'missing_credentials', 'Email and password are required.', array( 'status' => 400 ) );
			}

			$user = wp_authenticate( $username, $password );
			if ( is_wp_error( $user ) ) {
				return new WP_Error( 'invalid_login', 'Invalid email or password. Please check your credentials.', array( 'status' => 401 ) );
			}

			$token = screwnet_generate_customer_token( $user->ID );
			return rest_ensure_response( array(
				'success' => true,
				'token'   => $token,
				'user'    => screwnet_format_customer_data( $user ),
			) );
		},
	) );

	// B. Customer Registration
	register_rest_route( 'screwnet/v1', '/auth/register', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$email      = sanitize_email( $request->get_param( 'email' ) );
			$password   = (string) $request->get_param( 'password' );
			$first_name = sanitize_text_field( $request->get_param( 'first_name' ) );
			$last_name  = sanitize_text_field( $request->get_param( 'last_name' ) );
			$phone      = sanitize_text_field( $request->get_param( 'phone' ) );

			if ( ! is_email( $email ) ) {
				return new WP_Error( 'invalid_email', 'A valid email address is required.', array( 'status' => 400 ) );
			}

			if ( strlen( $password ) < 6 ) {
				return new WP_Error( 'weak_password', 'Password must be at least 6 characters long.', array( 'status' => 400 ) );
			}

			if ( email_exists( $email ) ) {
				return new WP_Error( 'email_exists', 'An account is already registered with this email address.', array( 'status' => 400 ) );
			}

			$extra = array(
				'first_name' => $first_name,
				'last_name'  => $last_name,
				'role'       => 'customer',
			);

			if ( function_exists( 'wc_create_new_customer' ) ) {
				$customer_id = wc_create_new_customer( $email, '', $password, $extra );
			} else {
				$customer_id = wp_create_user( $email, $password, $email );
				if ( ! is_wp_error( $customer_id ) ) {
					wp_update_user( array(
						'ID'         => $customer_id,
						'first_name' => $first_name,
						'last_name'  => $last_name,
						'role'       => 'customer',
					) );
				}
			}

			if ( is_wp_error( $customer_id ) ) {
				return new WP_Error( 'registration_failed', $customer_id->get_error_message(), array( 'status' => 400 ) );
			}

			if ( $phone ) {
				update_user_meta( $customer_id, 'billing_phone', $phone );
			}
			if ( $first_name ) {
				update_user_meta( $customer_id, 'billing_first_name', $first_name );
			}
			if ( $last_name ) {
				update_user_meta( $customer_id, 'billing_last_name', $last_name );
			}

			$user  = get_user_by( 'id', $customer_id );
			$token = screwnet_generate_customer_token( $customer_id );

			return rest_ensure_response( array(
				'success' => true,
				'token'   => $token,
				'user'    => screwnet_format_customer_data( $user ),
			) );
		},
	) );

	// C. Customer Profile / Me
	register_rest_route( 'screwnet/v1', '/auth/me', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$user = screwnet_get_customer_from_request( $request );
			if ( ! $user ) {
				return new WP_Error( 'unauthorized', 'Session expired or invalid token. Please log in again.', array( 'status' => 401 ) );
			}
			return rest_ensure_response( array(
				'success' => true,
				'user'    => screwnet_format_customer_data( $user ),
			) );
		},
	) );

	// D. Update Profile (Name, Email, Password)
	register_rest_route( 'screwnet/v1', '/auth/update-profile', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$user = screwnet_get_customer_from_request( $request );
			if ( ! $user ) {
				return new WP_Error( 'unauthorized', 'Session expired. Please log in again.', array( 'status' => 401 ) );
			}

			$first_name       = sanitize_text_field( $request->get_param( 'first_name' ) );
			$last_name        = sanitize_text_field( $request->get_param( 'last_name' ) );
			$email            = sanitize_email( $request->get_param( 'email' ) );
			$current_password = (string) $request->get_param( 'current_password' );
			$new_password     = (string) $request->get_param( 'new_password' );

			$update_args = array( 'ID' => $user->ID );

			if ( ! empty( $first_name ) ) {
				$update_args['first_name'] = $first_name;
				update_user_meta( $user->ID, 'billing_first_name', $first_name );
			}
			if ( ! empty( $last_name ) ) {
				$update_args['last_name'] = $last_name;
				update_user_meta( $user->ID, 'billing_last_name', $last_name );
			}

			if ( ! empty( $first_name ) || ! empty( $last_name ) ) {
				$update_args['display_name'] = trim( ( $first_name ?: $user->first_name ) . ' ' . ( $last_name ?: $user->last_name ) );
			}

			if ( ! empty( $email ) && $email !== $user->user_email ) {
				if ( ! is_email( $email ) ) {
					return new WP_Error( 'invalid_email', 'Invalid email address provided.', array( 'status' => 400 ) );
				}
				if ( email_exists( $email ) ) {
					return new WP_Error( 'email_taken', 'Email is already taken by another account.', array( 'status' => 400 ) );
				}
				$update_args['user_email'] = $email;
			}

			// Password Change Check
			if ( ! empty( $new_password ) ) {
				if ( empty( $current_password ) || ! wp_check_password( $current_password, $user->user_pass, $user->ID ) ) {
					return new WP_Error( 'wrong_password', 'Current password was incorrect.', array( 'status' => 400 ) );
				}
				if ( strlen( $new_password ) < 6 ) {
					return new WP_Error( 'weak_password', 'New password must be at least 6 characters.', array( 'status' => 400 ) );
				}
				$update_args['user_pass'] = $new_password;
			}

			$updated = wp_update_user( $update_args );
			if ( is_wp_error( $updated ) ) {
				return new WP_Error( 'update_failed', $updated->get_error_message(), array( 'status' => 400 ) );
			}

			$fresh_user = get_user_by( 'id', $user->ID );
			$new_token  = screwnet_generate_customer_token( $user->ID );

			return rest_ensure_response( array(
				'success' => true,
				'token'   => $new_token,
				'user'    => screwnet_format_customer_data( $fresh_user ),
			) );
		},
	) );

	// E. Update Address (Billing or Shipping)
	register_rest_route( 'screwnet/v1', '/auth/update-address', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$user = screwnet_get_customer_from_request( $request );
			if ( ! $user ) {
				return new WP_Error( 'unauthorized', 'Session expired. Please log in again.', array( 'status' => 401 ) );
			}

			$type    = sanitize_key( $request->get_param( 'type' ) ?: 'billing' );
			$type    = in_array( $type, array( 'billing', 'shipping' ), true ) ? $type : 'billing';
			$address = $request->get_param( 'address' );

			if ( ! is_array( $address ) ) {
				return new WP_Error( 'invalid_address', 'Address payload is missing.', array( 'status' => 400 ) );
			}

			$allowed_fields = array(
				'first_name',
				'last_name',
				'company',
				'address_1',
				'address_2',
				'city',
				'state',
				'postcode',
				'country',
				'phone',
				'email',
			);

			foreach ( $allowed_fields as $field ) {
				if ( isset( $address[ $field ] ) ) {
					$val = sanitize_text_field( $address[ $field ] );
					update_user_meta( $user->ID, "{$type}_{$field}", $val );
				}
			}

			$fresh_user = get_user_by( 'id', $user->ID );
			return rest_ensure_response( array(
				'success' => true,
				'user'    => screwnet_format_customer_data( $fresh_user ),
			) );
		},
	) );

	// F. Customer Orders List
	register_rest_route( 'screwnet/v1', '/auth/orders', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$user = screwnet_get_customer_from_request( $request );
			if ( ! $user ) {
				return new WP_Error( 'unauthorized', 'Session expired. Please log in again.', array( 'status' => 401 ) );
			}

			if ( ! function_exists( 'wc_get_orders' ) ) {
				return rest_ensure_response( array( 'orders' => array() ) );
			}

			// Query orders by customer_id OR billing_email
			$orders_by_id = wc_get_orders( array(
				'customer_id' => $user->ID,
				'limit'       => 50,
				'orderby'     => 'date',
				'order'       => 'DESC',
			) );

			$orders_by_email = wc_get_orders( array(
				'billing_email' => $user->user_email,
				'limit'         => 50,
				'orderby'       => 'date',
				'order'         => 'DESC',
			) );

			$combined = array();
			foreach ( array_merge( $orders_by_id, $orders_by_email ) as $order ) {
				if ( $order && is_a( $order, 'WC_Order' ) ) {
					$combined[ $order->get_id() ] = $order;
				}
			}

			// Sort by date descending
			usort( $combined, function ( $a, $b ) {
				$tA = $a->get_date_created() ? $a->get_date_created()->getTimestamp() : 0;
				$tB = $b->get_date_created() ? $b->get_date_created()->getTimestamp() : 0;
				return $tB <=> $tA;
			} );

			$results = array();
			foreach ( $combined as $order ) {
				$results[] = screwnet_format_order_data( $order );
			}

			return rest_ensure_response( array(
				'success' => true,
				'orders'  => $results,
				'count'   => count( $results ),
			) );
		},
	) );

	// G. Lost Password Trigger
	register_rest_route( 'screwnet/v1', '/auth/lost-password', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$email = sanitize_email( $request->get_param( 'email' ) );
			if ( ! is_email( $email ) || ! email_exists( $email ) ) {
				// Don't leak if email exists or not, but return clean message
				return rest_ensure_response( array(
					'success' => true,
					'message' => 'If an account exists with this email, a reset link has been dispatched.',
				) );
			}
			$user = get_user_by( 'email', $email );
			if ( $user && function_exists( 'retrieve_password' ) ) {
				retrieve_password( $user->user_login );
			}
			return rest_ensure_response( array(
				'success' => true,
				'message' => 'Password reset instructions have been sent to your email.',
			) );
		},
	) );

} );


// =========================================================================
// 4. FRONTEND REDIRECT TO WP-LOGIN OR HEADLESS STOREFRONT
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

	// Any visit to /my-account on the subdomain redirects to https://screwnet.in/account
	if ( false !== strpos( $request_uri, 'my-account' ) ) {
		wp_redirect( 'https://screwnet.in/account', 301 );
		exit;
	}

	// If logged in as admin, redirect to admin dashboard
	if ( is_user_logged_in() && current_user_can( 'manage_options' ) ) {
		wp_safe_redirect( admin_url() );
		exit;
	}

	// Otherwise, redirect frontend visitors directly to WordPress Login
	wp_safe_redirect( wp_login_url() );
	exit;
}, 1 );

// Ensure screwnet.in is recognized as an allowed safe redirect host
add_filter( 'allowed_redirect_hosts', function ( $hosts ) {
	$hosts[] = 'screwnet.in';
	$hosts[] = 'www.screwnet.in';
	return array_unique( $hosts );
} );


// =========================================================================
// 5. CUSTOM SCREWNET BRANDING ON LOGIN PAGE & ADMIN BAR
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
