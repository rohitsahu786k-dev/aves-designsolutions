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

	// H. Email Verification: Send 6-Digit Code
	register_rest_route( 'screwnet/v1', '/auth/send-verification-code', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$email      = sanitize_email( $request->get_param( 'email' ) );
			$first_name = sanitize_text_field( $request->get_param( 'first_name' ) );

			if ( ! is_email( $email ) ) {
				return new WP_Error( 'invalid_email', 'Please enter a valid email address.', array( 'status' => 400 ) );
			}

			if ( email_exists( $email ) ) {
				return new WP_Error( 'email_exists', 'An account is already registered with this email. Please sign in instead.', array( 'status' => 400 ) );
			}

			// Generate 6-digit numeric OTP
			$otp = str_pad( (string) wp_rand( 100000, 999999 ), 6, '0', STR_PAD_LEFT );

			// Store in transient for 15 minutes (900 seconds)
			$transient_key = 'screwnet_email_otp_' . md5( strtolower( $email ) );
			set_transient( $transient_key, $otp, 15 * MINUTE_IN_SECONDS );

			// Send professional HTML branded email
			$sent = screwnet_send_email_verification_code( $email, $otp, $first_name );

			if ( ! $sent ) {
				// Retry with basic fallback headers if custom headers failed
				$sent = wp_mail( $email, 'Your screwnet Verification Code: ' . $otp, "Your verification code is: $otp\nThis code expires in 15 minutes." );
			}

			return rest_ensure_response( array(
				'success' => true,
				'message' => 'A 6-digit verification code has been sent to ' . $email . '.',
			) );
		},
	) );

	// I. Email Verification: Verify Code and Create Verified Customer
	register_rest_route( 'screwnet/v1', '/auth/verify-code', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$email      = sanitize_email( $request->get_param( 'email' ) );
			$code       = trim( sanitize_text_field( $request->get_param( 'code' ) ) );
			$password   = (string) $request->get_param( 'password' );
			$first_name = sanitize_text_field( $request->get_param( 'first_name' ) );
			$last_name  = sanitize_text_field( $request->get_param( 'last_name' ) );
			$phone      = sanitize_text_field( $request->get_param( 'phone' ) );

			if ( ! is_email( $email ) || empty( $code ) ) {
				return new WP_Error( 'missing_fields', 'Email and verification code are required.', array( 'status' => 400 ) );
			}

			// Validate OTP transient
			$transient_key = 'screwnet_email_otp_' . md5( strtolower( $email ) );
			$expected_otp  = get_transient( $transient_key );

			if ( empty( $expected_otp ) || (string) $expected_otp !== (string) $code ) {
				return new WP_Error( 'invalid_otp', 'The verification code entered is invalid or has expired. Please request a new code.', array( 'status' => 400 ) );
			}

			// Consume OTP
			delete_transient( $transient_key );

			// Check if already created in the meantime
			if ( email_exists( $email ) ) {
				$existing_user = get_user_by( 'email', $email );
				$token         = screwnet_generate_customer_token( $existing_user->ID );
				return rest_ensure_response( array(
					'success' => true,
					'token'   => $token,
					'user'    => screwnet_format_customer_data( $existing_user ),
				) );
			}

			if ( strlen( $password ) < 6 ) {
				return new WP_Error( 'weak_password', 'Password must be at least 6 characters long.', array( 'status' => 400 ) );
			}

			// Create customer in WooCommerce
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

			// Mark customer as verified across WooCommerce and email verification plugins
			update_user_meta( $customer_id, '_customer_email_verified', 'yes' );
			update_user_meta( $customer_id, 'wc_email_verified', 'true' );
			update_user_meta( $customer_id, 'alg_wc_ev_is_activated', '1' );
			update_user_meta( $customer_id, 'email_verified_at', current_time( 'mysql' ) );

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
				'message' => 'Email verified and account activated successfully!',
			) );
		},
	) );

	// J. Track Order Endpoint (Reads Advanced Shipment Tracking AST metadata)
	register_rest_route( 'screwnet/v1', '/track-order', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$order_input = sanitize_text_field( $request->get_param( 'order_id' ) ?: $request->get_param( 'order_number' ) );
			$identifier  = sanitize_text_field( $request->get_param( 'identifier' ) ?: $request->get_param( 'email' ) ?: $request->get_param( 'phone' ) );

			if ( empty( $order_input ) || empty( $identifier ) ) {
				return new WP_Error( 'missing_params', 'Order number and billing email or phone are required.', array( 'status' => 400 ) );
			}

			// Clean order number (#1042 -> 1042)
			$clean_id = absint( preg_replace( '/[^0-9]/', '', $order_input ) );
			$order    = null;

			if ( $clean_id && function_exists( 'wc_get_order' ) ) {
				$order = wc_get_order( $clean_id );
			}

			// Fallback: search by order_number meta if not found by primary ID
			if ( ! $order && function_exists( 'wc_get_orders' ) ) {
				$found = wc_get_orders( array(
					'limit' => 1,
					'meta_query' => array(
						array(
							'key'     => '_order_number',
							'value'   => $order_input,
							'compare' => '=',
						),
					),
				) );
				if ( ! empty( $found ) ) {
					$order = $found[0];
				}
			}

			if ( ! $order || ! is_a( $order, 'WC_Order' ) ) {
				return new WP_Error( 'order_not_found', 'No order found matching order number #' . esc_html( $order_input ) . '. Please verify and try again.', array( 'status' => 404 ) );
			}

			// Verify that identifier matches billing email or billing phone
			$billing_email = strtolower( trim( $order->get_billing_email() ) );
			$billing_phone = preg_replace( '/[^0-9]/', '', (string) $order->get_billing_phone() );
			$clean_ident   = strtolower( trim( $identifier ) );
			$clean_ident_num = preg_replace( '/[^0-9]/', '', $identifier );

			$matches_email = ( $clean_ident === $billing_email );
			$matches_phone = ( strlen( $clean_ident_num ) >= 8 && substr( $billing_phone, -10 ) === substr( $clean_ident_num, -10 ) );

			if ( ! $matches_email && ! $matches_phone ) {
				return new WP_Error( 'verification_failed', 'The email or phone number provided does not match the records for order #' . $order->get_order_number() . '.', array( 'status' => 403 ) );
			}

			// Retrieve tracking items from Advanced Shipment Tracking (AST)
			$tracking_items = screwnet_get_order_shipment_tracking( $order );
			$has_tracking   = ! empty( $tracking_items );
			$order_status   = $order->get_status();

			// Determine current milestone step:
			// 1: Order Confirmed
			// 2: Processing & Packaging
			// 3: Dispatched & In Transit
			// 4: Delivered
			// -1: Cancelled/Refunded
			$step = 1;
			if ( in_array( $order_status, array( 'cancelled', 'failed', 'refunded' ), true ) ) {
				$step = -1;
			} elseif ( 'completed' === $order_status ) {
				$step = 4;
			} elseif ( $has_tracking ) {
				$step = 3;
			} elseif ( in_array( $order_status, array( 'processing' ), true ) ) {
				$step = 2;
			} else {
				$step = 1;
			}

			// Status text description
			$status_messages = array(
				1  => 'Your order has been received and confirmed by screwnet.',
				2  => 'Your fasteners are being picked, packaged, and prepared for dispatch at our warehouse.',
				3  => 'Your shipment has been handed over to our courier partner and is on its way.',
				4  => 'Your order has been successfully delivered.',
				-1 => 'This order was cancelled or refunded.',
			);

			// Format items summary
			$items_summary = array();
			foreach ( $order->get_items() as $item ) {
				$product   = $item->get_product();
				$image_url = '';
				if ( $product && $product->get_image_id() ) {
					$image_url = wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ) ?: '';
				}
				$items_summary[] = array(
					'name'     => $item->get_name(),
					'quantity' => $item->get_quantity(),
					'total'    => (float) $item->get_total(),
					'image'    => $image_url,
				);
			}

			return rest_ensure_response( array(
				'success'           => true,
				'order_id'          => $order->get_id(),
				'order_number'      => $order->get_order_number(),
				'status'            => $order_status,
				'status_name'       => function_exists( 'wc_get_order_status_name' ) ? wc_get_order_status_name( $order_status ) : ucfirst( $order_status ),
				'current_step'      => $step,
				'status_message'    => $status_messages[ $step ] ?? '',
				'date_created'      => $order->get_date_created() ? $order->get_date_created()->date( 'd M Y, h:i A' ) : '',
				'total'             => (float) $order->get_total(),
				'currency'          => $order->get_currency(),
				'payment_method'    => $order->get_payment_method_title(),
				'shipping_address'  => array(
					'name'     => trim( $order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name() ) ?: trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
					'address'  => trim( $order->get_shipping_address_1() . ' ' . $order->get_shipping_address_2() ) ?: trim( $order->get_billing_address_1() . ' ' . $order->get_billing_address_2() ),
					'city'     => $order->get_shipping_city() ?: $order->get_billing_city(),
					'state'    => $order->get_shipping_state() ?: $order->get_billing_state(),
					'postcode' => $order->get_shipping_postcode() ?: $order->get_billing_postcode(),
				),
				'tracking_items'    => $tracking_items,
				'items'             => $items_summary,
			) );
		},
	) );

	// K. Test Email Endpoint - Cross-checks email delivery from aves.designsolutions@gmail.com
	register_rest_route( 'screwnet/v1', '/test-email', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$to = sanitize_email( $request->get_param( 'to' ) ) ?: 'aves.designsolutions@gmail.com';
			$subject = '[Screwnet Verification] Test Email Delivery Check';
			$body = "<h2>Screwnet Email Delivery Test</h2>\n<p>This is a verification message sent from <strong>aves.designsolutions@gmail.com</strong>.</p>\n<p>Timestamp: " . current_time( 'mysql' ) . "</p>";
			$headers = array(
				'Content-Type: text/html; charset=UTF-8',
				'From: Screwnet <aves.designsolutions@gmail.com>',
				'Reply-To: aves.designsolutions@gmail.com',
			);
			$sent = wp_mail( $to, $subject, $body, $headers );
			return rest_ensure_response( array(
				'success'   => (bool) $sent,
				'from'      => 'aves.designsolutions@gmail.com',
				'recipient' => $to,
				'timestamp' => current_time( 'mysql' ),
				'message'   => $sent ? 'Test email dispatched successfully from aves.designsolutions@gmail.com.' : 'wp_mail failed to send test email. Check server mail logs.',
			) );
		},
	) );

	// L. Download Catalogue Endpoint (Reads ACF fields or provides default Screwnet fastener catalogues)
	register_rest_route( 'screwnet/v1', '/catalogue', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$page = get_page_by_path( 'download-catalogue' );
			if ( ! $page ) {
				$page = get_page_by_path( 'catalogue' );
			}

			$acf = array();
			if ( $page && function_exists( 'get_fields' ) ) {
				$acf = get_fields( $page->ID ) ?: array();
			}

			$default_catalogues = array(
				array(
					'id'            => 'screwnet-master-catalogue-2026',
					'doc_title'     => 'screwnet Master Industrial Fasteners Catalogue 2026',
					'doc_subtitle'  => 'Complete technical specifications, DIN/ISO dimensional charts, and load ratings for machine screws, socket heads, hex bolts, nuts, and washers.',
					'doc_file'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet_Fasteners_Master_Catalog_2026.pdf',
					'doc_thumbnail' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
					'doc_size'      => '18.4 MB',
					'doc_pages'     => '96 Pages',
					'doc_edition'   => '2026 Edition',
					'category'      => 'Master Catalogue',
				),
				array(
					'id'            => 'ss304-ss316-specification-guide',
					'doc_title'     => 'Stainless Steel (SS304 & SS316) Fastener Technical Sheet',
					'doc_subtitle'  => 'Corrosion resistance ratings, chemical composition, torque values, and marine/coastal grade selection criteria.',
					'doc_file'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/SS304_SS316_Technical_Fastener_Guide.pdf',
					'doc_thumbnail' => 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
					'doc_size'      => '8.2 MB',
					'doc_pages'     => '42 Pages',
					'doc_edition'   => 'Rev 4.1',
					'category'      => 'Stainless Steel',
				),
				array(
					'id'            => 'high-tensile-grade-handbook',
					'doc_title'     => 'High Tensile Grade 8.8 & 10.9 Fastener Engineering Manual',
					'doc_subtitle'  => 'Proof stress, shear strength, ultimate tensile strength (UTS), and precision automotive/structural clamping requirements.',
					'doc_file'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/High_Tensile_Grade_8.8_10.9_Fasteners_Manual.pdf',
					'doc_thumbnail' => 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
					'doc_size'      => '12.5 MB',
					'doc_pages'     => '58 Pages',
					'doc_edition'   => 'ISO 898-1 Certified',
					'category'      => 'High Tensile',
				),
				array(
					'id'            => 'metric-thread-pitch-torque-matrix',
					'doc_title'     => 'Standard Metric Thread Pitch & Torque Matrix (M2 – M36)',
					'doc_subtitle'  => 'Coarse & fine pitch dimensions, tap drill sizes, tightening torque recommendations, and thread engagement depths.',
					'doc_file'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/Metric_Thread_Pitch_Torque_Chart.pdf',
					'doc_thumbnail' => 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
					'doc_size'      => '4.8 MB',
					'doc_pages'     => '24 Pages',
					'doc_edition'   => 'DIN 13-1 Spec',
					'category'      => 'Thread Standards',
				),
			);

			$default_features = array(
				array(
					'feature_title' => '5,000+ Fastener Sizes in Ready Stock',
					'feature_desc'  => 'SS304, SS316, Grade 8.8, 10.9, Brass & Nickel-plated precision hardware available for immediate bulk dispatch.',
				),
				array(
					'feature_title' => 'DIN, ISO & ASTM Certified Tolerances',
					'feature_desc'  => 'Strict 6g / 6H thread fit gauges ensure perfect engagement without galling or thread stripping in production.',
				),
				array(
					'feature_title' => 'EN 10204 3.1 Mill Test Certificates',
					'feature_desc'  => 'Every batch is backed by 100% material traceability and laboratory chemical analysis reports.',
				),
				array(
					'feature_title' => '24-48h Express Pan-India Delivery',
					'feature_desc'  => 'Doorstep freight delivery with real-time consignment tracking via Delhivery, BlueDart, and DTDC.',
				),
			);

			$catalogues = ! empty( $acf['catalogues_list'] ) ? $acf['catalogues_list'] : $default_catalogues;
			$features   = ! empty( $acf['features_list'] ) ? $acf['features_list'] : $default_features;

			return rest_ensure_response( array(
				'badge'          => $acf['catalogue_badge'] ?? 'screwnet Technical Fasteners',
				'title'          => $acf['catalogue_title'] ?? 'Download Official Fastener Catalogues & Engineering Specifications',
				'subtitle'       => $acf['catalogue_subtitle'] ?? 'Get instant access to complete dimensions, DIN/ISO standards, tensile ratings, and torque specs for 5,000+ precision screws and industrial fasteners.',
				'banner_desktop' => $acf['banner_desktop'] ?? '',
				'banner_mobile'  => $acf['banner_mobile'] ?? '',
				'catalogues'     => $catalogues,
				'features'       => $features,
				'contact'        => array(
					'email'         => $acf['contact_email'] ?? 'aves.designsolutions@gmail.com',
					'phone'         => $acf['contact_phone'] ?? '+91 81077 53647',
					'phone_display' => $acf['contact_phone'] ?? '+91 81077 53647',
					'whatsapp'      => $acf['contact_whatsapp'] ?? '918107753647',
					'address'       => $acf['contact_address'] ?? '2, Paneri Belda Road, Udaipur, Rajasthan, India',
					'working_hours' => $acf['working_hours'] ?? 'Monday – Saturday: 9:00 AM – 6:30 PM',
				),
			) );
		},
	) );

	// M. Request Catalogue via Email / Lead Capture
	register_rest_route( 'screwnet/v1', '/catalogue/request', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $request ) {
			$name            = sanitize_text_field( $request->get_param( 'name' ) );
			$email           = sanitize_email( $request->get_param( 'email' ) );
			$phone           = sanitize_text_field( $request->get_param( 'phone' ) );
			$company         = sanitize_text_field( $request->get_param( 'company' ) );
			$catalogue_id    = sanitize_text_field( $request->get_param( 'catalogue_id' ) );
			$catalogue_title = sanitize_text_field( $request->get_param( 'catalogue_title' ) ) ?: 'screwnet Master Fasteners Catalogue 2026';

			if ( ! is_email( $email ) ) {
				return new WP_Error( 'invalid_email', 'Please provide a valid email address.', array( 'status' => 400 ) );
			}

			// Send professional PDF download link to the user
			$subject = 'Your screwnet Fasteners Catalogue Download Link';
			$body = '
			<div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
				<h2 style="color: #000000; margin-top: 0;">screwnet Fasteners Catalogue</h2>
				<p>Hello ' . esc_html( $name ?: 'Customer' ) . ',</p>
				<p>Thank you for your interest in screwnet technical fasteners. Here is your official copy of the requested catalogue:</p>
				<div style="background: #f4f4f5; padding: 18px; border-radius: 6px; margin: 20px 0; border: 1px solid #e4e4e7;">
					<strong style="color: #000000; font-size: 16px; display: block; margin-bottom: 6px;">' . esc_html( $catalogue_title ) . '</strong>
					<p style="margin: 0 0 12px; color: #52525b; font-size: 13px;">Full dimensional charts, torque specifications, and DIN/ISO standards.</p>
					<a href="https://screwnet.in/download-catalogue" style="display: inline-block; background: #000000; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">Download PDF Catalogue</a>
				</div>
				<p style="color: #52525b; font-size: 13px; line-height: 1.5;">For bulk B2B procurement, custom length fabrication, or GST tax invoices, contact our engineering sales desk directly at <a href="mailto:aves.designsolutions@gmail.com" style="color: #000000; font-weight: 700;">aves.designsolutions@gmail.com</a> or phone <strong>+91 81077 53647</strong>.</p>
				<hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
				<p style="color: #a1a1aa; font-size: 11px; margin: 0;">screwnet Technical Fasteners &bull; Udaipur, Rajasthan, India &bull; <a href="https://screwnet.in" style="color: #000000;">screwnet.in</a></p>
			</div>';

			$headers = array(
				'Content-Type: text/html; charset=UTF-8',
				'From: Screwnet <aves.designsolutions@gmail.com>',
				'Reply-To: aves.designsolutions@gmail.com',
			);

			$sent = wp_mail( $email, $subject, $body, $headers );

			// Also notify admin at aves.designsolutions@gmail.com
			$admin_subject = '[Catalogue Lead] ' . ( $name ?: $email ) . ' requested ' . $catalogue_title;
			$admin_body    = "New Catalogue Request:\n\nName: $name\nEmail: $email\nPhone: $phone\nCompany: $company\nCatalogue: $catalogue_title\nTimestamp: " . current_time( 'mysql' );
			wp_mail( 'aves.designsolutions@gmail.com', $admin_subject, $admin_body );

			return rest_ensure_response( array(
				'success' => true,
				'message' => 'Catalogue download link has been dispatched to your email successfully.',
			) );
		},
	) );

	// N. Global Storefront Site Settings & Banners (ACF options + fallback)
	register_rest_route( 'screwnet/v1', '/site-settings', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			$options = function_exists( 'get_fields' ) ? ( get_fields( 'options' ) ?: array() ) : array();

			// Also check front page ACF fields
			$front_page = get_page_by_path( 'home' ) ?: ( get_option( 'page_on_front' ) ? get_post( get_option( 'page_on_front' ) ) : null );
			$front_acf  = ( $front_page && function_exists( 'get_fields' ) ) ? ( get_fields( $front_page->ID ) ?: array() ) : array();

			return rest_ensure_response( array(
				'contact' => array(
					'email'           => $options['contact_email'] ?? $front_acf['contact_email'] ?? 'aves.designsolutions@gmail.com',
					'phone'           => $options['contact_phone'] ?? $front_acf['contact_phone'] ?? '+91 81077 53647',
					'whatsapp_number' => $options['contact_whatsapp'] ?? $front_acf['contact_whatsapp'] ?? '918107753647',
					'address'         => $options['contact_address'] ?? $front_acf['contact_address'] ?? '2, Paneri Belda Road, Udaipur, Rajasthan, India',
					'working_hours'   => $options['working_hours'] ?? $front_acf['working_hours'] ?? 'Monday – Saturday: 9:00 AM – 6:30 PM',
				),
				'banners' => array(
					'hero_desktop'  => $options['banner_hero_desktop'] ?? $front_acf['banner_desktop'] ?? '',
					'hero_mobile'   => $options['banner_hero_mobile'] ?? $front_acf['banner_mobile'] ?? '',
					'promo_desktop' => $options['banner_promo_desktop'] ?? '',
					'promo_mobile'  => $options['banner_promo_mobile'] ?? '',
				),
				'announcement' => $options['top_announcement'] ?? $front_acf['top_announcement'] ?? 'Fast Pan-India Delivery • ISO & DIN Certified High-Tensile Fasteners • Instant GST Invoicing',
			) );
		},
	) );

	// O. Inspect ACF field groups definition
	register_rest_route( 'screwnet/v1', '/inspect-acf', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			$contact_fields = function_exists( 'acf_get_fields' ) ? acf_get_fields( 'group_6b74134791018' ) : array();
			$banner_fields  = function_exists( 'acf_get_fields' ) ? acf_get_fields( 'group_77faf9b290de5' ) : array();
			return rest_ensure_response( array(
				'contact_fields' => array_map( function ( $f ) {
					return array( 'name' => $f['name'], 'key' => $f['key'], 'type' => $f['type'], 'label' => $f['label'] );
				}, $contact_fields ?: array() ),
				'banner_fields'  => array_map( function ( $f ) {
					return array( 'name' => $f['name'], 'key' => $f['key'], 'type' => $f['type'], 'label' => $f['label'] );
				}, $banner_fields ?: array() ),
			) );
		},
	) );

	// P. Seed Initial ACF Data for Site Contact, Site Banners, and Announcements
	register_rest_route( 'screwnet/v1', '/seed-acf-data', array(
		'methods'             => array( 'POST', 'GET' ),
		'permission_callback' => '__return_true',
		'callback'            => function () {
			$created = array();

			// 1. Seed Site Contact & Global Settings if empty
			$existing_contact = get_posts( array(
				'post_type'      => 'site_contact',
				'posts_per_page' => 1,
				'post_status'    => 'any',
			) );

			if ( empty( $existing_contact ) ) {
				$contact_id = wp_insert_post( array(
					'post_title'   => 'Global Settings',
					'post_name'    => 'global-settings',
					'post_type'    => 'site_contact',
					'post_status'  => 'publish',
					'post_content' => '',
				) );

				if ( $contact_id && ! is_wp_error( $contact_id ) ) {
					$contact_data = array(
						'company_name'        => 'screwnet Industrial Fasteners',
						'display_name'        => 'screwnet',
						'support_hours'       => 'Monday – Saturday: 9:00 AM – 6:30 PM IST',
						'phone_primary'       => '+91 81077 53647',
						'phone_secondary'     => '+91 81077 53647',
						'whatsapp_number'     => '918107753647',
						'support_email'       => 'aves.designsolutions@gmail.com',
						'sales_email'         => 'aves.designsolutions@gmail.com',
						'address_line_1'      => '2, Paneri Belda Road',
						'address_line_2'      => '',
						'city'                => 'Udaipur',
						'state'               => 'Rajasthan',
						'postal_code'         => '313001',
						'country'             => 'India',
						'latitude'            => 24.5854,
						'longitude'           => 73.7125,
						'google_maps_url'     => 'https://www.google.com/maps/search/?api=1&query=2+PANERI+BELDA+ROAD+UDAIPUR',
						'map_embed_url'       => 'https://maps.google.com/maps?q=2%2C%20Paneri%20Belda%20Road%2C%20Udaipur%2C%20Rajasthan%2C%20313001%2C%20India&t=m&z=15&output=embed&iwloc=near',
						'privacy_policy_url'  => '/pages/privacy-policy',
						'terms_url'           => '/pages/terms-and-conditions',
						'shipping_policy_url' => '/pages/shipping-policy',
						'returns_policy_url'  => '/pages/refund-policy',
						'footer_note'         => 'screwnet — India\'s Premier Online Industrial Fasteners & Screws Store',
					);

					foreach ( $contact_data as $key => $val ) {
						if ( function_exists( 'update_field' ) ) {
							update_field( $key, $val, $contact_id );
						}
						update_post_meta( $contact_id, $key, $val );
					}
					$created[] = "site_contact (ID: $contact_id - Global Settings)";
				}
			}

			// 2. Seed Site Banners if empty
			$existing_banners = get_posts( array(
				'post_type'      => 'site_banner',
				'posts_per_page' => 1,
				'post_status'    => 'any',
			) );

			if ( empty( $existing_banners ) ) {
				$banners_to_create = array(
					array(
						'title'       => 'Precision Industrial Fasteners & Structural Hardware',
						'placement'   => 'home_hero',
						'sort_order'  => 0,
						'is_active'   => 1,
						'eyebrow'     => 'PRECISION INDUSTRIAL FASTENERS',
						'heading'     => 'High-Tensile Bolts, Screws & Structural Hardware',
						'subheading'  => 'Certified Grade 8.8, 10.9 & 12.9 alloy steel and SS 304/316 marine stainless hardware with real-time stock sync.',
						'cta_label'   => 'Explore All Fasteners',
						'cta_url'     => '/shop',
						'desktop'     => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-desktop-banner.webp',
						'mobile'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-mobile-banner.webp',
					),
					array(
						'title'       => 'Bulk Industrial Screws, Bolts & Hardware',
						'placement'   => 'home_hero',
						'sort_order'  => 1,
						'is_active'   => 1,
						'eyebrow'     => 'ENGINEERED FOR EVERY BUILD',
						'heading'     => 'Bulk Industrial Screws, Bolts & Hardware',
						'subheading'  => 'Hardened carbon steel & ruspert coated screws engineered for maximum pull-out strength and structural durability.',
						'cta_label'   => 'Shop Bulk Hardware',
						'cta_url'     => '/shop',
						'desktop'     => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-bulk-screws-bolts-hardware-desktop-banner.webp',
						'mobile'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-engineered-for-every-build-mobile-banner.webp',
					),
					array(
						'title'       => 'Corrosion-Resistant Stainless Fasteners',
						'placement'   => 'home_hero',
						'sort_order'  => 2,
						'is_active'   => 1,
						'eyebrow'     => 'RELIABLE INDUSTRIAL SUPPLY',
						'heading'     => 'Corrosion-Resistant Stainless Fasteners',
						'subheading'  => 'Socket head cap screws, hex bolts, spring washers, and nyloc nuts with mill test certification available.',
						'cta_label'   => 'View Stainless Range',
						'cta_url'     => '/shop?search=stainless',
						'desktop'     => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-reliable-industrial-supply-desktop-banner.webp',
						'mobile'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-stainless-steel-screws-bolts-mobile-banner.webp',
					),
					array(
						'title'       => 'Shop Catalog Hero Banner',
						'placement'   => 'shop_hero',
						'sort_order'  => 0,
						'is_active'   => 1,
						'eyebrow'     => 'PRECISION METRIC FASTENERS',
						'heading'     => 'Complete Industrial Fastener Catalog',
						'subheading'  => 'Order online with exact metric sizes, pitch specifications, and instant B2B quantity discounts.',
						'cta_label'   => 'Filter Fasteners',
						'cta_url'     => '/shop',
						'desktop'     => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-desktop-banner.webp',
						'mobile'      => 'https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-mobile-banner.webp',
					),
				);

				foreach ( $banners_to_create as $b ) {
					$banner_id = wp_insert_post( array(
						'post_title'   => $b['title'],
						'post_type'    => 'site_banner',
						'post_status'  => 'publish',
						'post_content' => '',
					) );

					if ( $banner_id && ! is_wp_error( $banner_id ) ) {
						$fields = array(
							'placement'              => $b['placement'],
							'carousel_group'         => 'default',
							'sort_order'             => $b['sort_order'],
							'is_active'              => $b['is_active'],
							'eyebrow'                => $b['eyebrow'],
							'heading'                => $b['heading'],
							'subheading'             => $b['subheading'],
							'cta_label'              => $b['cta_label'],
							'cta_url'                => $b['cta_url'],
							'whole_banner_clickable' => 1,
							'open_new_tab'           => 0,
							'text_alignment'         => 'left',
							'content_theme'          => 'light',
							'desktop_image'          => $b['desktop'],
							'mobile_image'           => $b['mobile'],
							'tablet_image'           => $b['desktop'],
							'fallback_image'         => $b['desktop'],
						);

						foreach ( $fields as $fk => $fv ) {
							if ( function_exists( 'update_field' ) ) {
								update_field( $fk, $fv, $banner_id );
							}
							update_post_meta( $banner_id, $fk, $fv );
						}
						$created[] = "site_banner (ID: $banner_id - " . $b['title'] . ")";
					}
				}
			}

			// 3. Seed Announcement if empty
			$existing_announcements = get_posts( array(
				'post_type'      => 'announcement',
				'posts_per_page' => 1,
				'post_status'    => 'any',
			) );

			if ( empty( $existing_announcements ) ) {
				$ann_id = wp_insert_post( array(
					'post_title'   => 'Default Top Announcement Bar',
					'post_type'    => 'announcement',
					'post_status'  => 'publish',
					'post_content' => '',
				) );

				if ( $ann_id && ! is_wp_error( $ann_id ) ) {
					$ann_fields = array(
						'announcement_text' => 'Fast Pan-India Delivery • ISO & DIN Certified High-Tensile Fasteners • Instant GST Invoicing',
						'is_active'         => 1,
					);
					foreach ( $ann_fields as $ak => $av ) {
						if ( function_exists( 'update_field' ) ) {
							update_field( $ak, $av, $ann_id );
						}
						update_post_meta( $ann_id, $ak, $av );
					}
					$created[] = "announcement (ID: $ann_id)";
				}
			}

			return rest_ensure_response( array(
				'success' => true,
				'created' => $created,
			) );
		},
	) );

} );

// Register ACF Options Page for Storefront Site Settings
add_action( 'acf/init', function () {
	if ( function_exists( 'acf_add_options_page' ) ) {
		acf_add_options_page( array(
			'page_title' => 'Screwnet Storefront Settings & Banners',
			'menu_title' => 'Storefront ACF',
			'menu_slug'  => 'screwnet-storefront-settings',
			'capability' => 'manage_options',
			'redirect'   => false,
			'icon_url'   => 'dashicons-admin-generic',
			'position'   => 59,
		) );
	}
} );

// =========================================================================
// UNIVERSAL OUTGOING EMAIL FILTERS - ENFORCES aves.designsolutions@gmail.com
// =========================================================================
add_filter( 'wp_mail_from', function ( $original_email ) {
	return 'aves.designsolutions@gmail.com';
}, 999 );

add_filter( 'wp_mail_from_name', function ( $original_name ) {
	return 'Screwnet';
}, 999 );

// =========================================================================
// HELPER: SEND PROFESSIONAL HTML VERIFICATION CODE EMAIL
// =========================================================================
function screwnet_send_email_verification_code( $email, $code, $first_name = '' ) {
	$subject  = 'Your screwnet Verification Code: ' . $code;
	$greeting = ! empty( $first_name ) ? 'Hello ' . esc_html( $first_name ) . ',' : 'Hello,';

	$body = '<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>screwnet Email Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
		<tr>
			<td align="center">
				<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
					<!-- Header -->
					<tr>
						<td style="background:#0f172a;padding:32px 28px;text-align:center;">
							<div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">
								screw<span style="color:#ef4444;">net</span><span style="font-size:16px;color:#94a3b8;font-weight:700;">.in</span>
							</div>
							<div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:3px;margin-top:4px;">
								INDUSTRIAL FASTENERS &amp; HARDWARE
							</div>
						</td>
					</tr>
					<!-- Body -->
					<tr>
						<td style="padding:36px 32px 28px;">
							<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">
								Verify Your Email Address
							</h1>
							<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
								' . $greeting . '<br>
								Thank you for creating an account with <strong>screwnet</strong>. Please use the 6-digit verification code below to confirm your email and complete your registration:
							</p>
							<!-- OTP Box -->
							<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
								<tr>
									<td align="center">
										<div style="display:inline-block;background:#f8fafc;border:2px dashed #0f172a;border-radius:12px;padding:16px 36px;text-align:center;">
											<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:1px;margin-bottom:6px;">
												One-Time Verification Code
											</div>
											<div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0f172a;font-family:Consolas,Monaco,monospace;margin-left:10px;">
												' . esc_html( $code ) . '
											</div>
										</div>
									</td>
								</tr>
							</table>
							<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
								&bull; This code is valid for <strong>15 minutes</strong>.<br>
								&bull; For your security, never share this code with anyone.<br>
								&bull; If you did not request this verification, please disregard this email.
							</p>
						</td>
					</tr>
					<!-- Divider -->
					<tr>
						<td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #f1f5f9;margin:0;"></td>
					</tr>
					<!-- Benefits -->
					<tr>
						<td style="padding:20px 32px;background:#fafaf9;">
							<div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:8px;">
								With your verified screwnet account:
							</div>
							<div style="font-size:12px;color:#64748b;line-height:1.6;">
								&check; Instant GST tax invoicing on all fastener orders<br>
								&check; Live shipment tracking with partner couriers<br>
								&check; Faster checkout &amp; saved shipping addresses
							</div>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="background:#f1f5f9;padding:24px 32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
							<p style="margin:0 0 6px;color:#64748b;font-weight:600;">screwnet &bull; Premium Industrial Fasteners, Screws &amp; Hardware</p>
							<p style="margin:0;">Udaipur, Rajasthan, India &bull; <a href="https://screwnet.in" style="color:#0f172a;text-decoration:none;font-weight:600;">screwnet.in</a></p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>';

	$headers = array(
		'Content-Type: text/html; charset=UTF-8',
		'From: Screwnet <aves.designsolutions@gmail.com>',
		'Reply-To: aves.designsolutions@gmail.com',
	);

	return wp_mail( $email, $subject, $body, $headers );
}

// =========================================================================
// HELPER: EXTRACT AST SHIPMENT TRACKING DETAILS
// =========================================================================
function screwnet_get_order_shipment_tracking( $order ) {
	$order_id       = $order->get_id();
	$tracking_items = array();

	// 1. Check if AST (Advanced Shipment Tracking) helper function exists
	if ( function_exists( 'ast_get_tracking_items' ) ) {
		$tracking_items = ast_get_tracking_items( $order_id );
	}

	// 2. Fallback to WooCommerce postmeta _wc_shipment_tracking_items
	if ( empty( $tracking_items ) ) {
		$meta = $order->get_meta( '_wc_shipment_tracking_items', true );
		if ( ! empty( $meta ) && is_array( $meta ) ) {
			$tracking_items = $meta;
		}
	}

	$cleaned = array();
	if ( ! empty( $tracking_items ) && is_array( $tracking_items ) ) {
		foreach ( $tracking_items as $item ) {
			$provider = $item['tracking_provider'] ?? $item['custom_tracking_provider'] ?? $item['formatted_tracking_provider'] ?? 'Courier';
			$number   = $item['tracking_number'] ?? '';
			$link     = $item['formatted_tracking_link'] ?? $item['tracking_link'] ?? '';
			$date     = $item['date_shipped'] ?? '';
			if ( is_numeric( $date ) ) {
				$date = date( 'd M Y', (int) $date );
			}

			// Generate courier track URL if tracking link is not populated
			if ( empty( $link ) && ! empty( $number ) ) {
				$prov_lower = strtolower( $provider );
				if ( false !== strpos( $prov_lower, 'delhivery' ) ) {
					$link = 'https://www.delhivery.com/track/package/' . urlencode( $number );
				} elseif ( false !== strpos( $prov_lower, 'bluedart' ) ) {
					$link = 'https://www.bluedart.com/tracking?numbers=' . urlencode( $number );
				} elseif ( false !== strpos( $prov_lower, 'dtdc' ) ) {
					$link = 'https://www.dtdc.in/tracking/shipment-tracking.asp';
				} elseif ( false !== strpos( $prov_lower, 'india post' ) || false !== strpos( $prov_lower, 'speed post' ) ) {
					$link = 'https://www.indiapost.gov.in/_layouts/15/dpt.ptc.tracktrace/tracktrace.aspx';
				}
			}

			$cleaned[] = array(
				'provider'        => $provider,
				'tracking_number' => $number,
				'tracking_link'   => $link,
				'date_shipped'    => $date,
			);
		}
	}

	return $cleaned;
}


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
			background-color: #f8fafc !important;
			background-image: radial-gradient(#e2e8f0 1.2px, transparent 1.2px) !important;
			background-size: 24px 24px !important;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
		}
		#login {
			padding-top: 5% !important;
		}
		#login h1 a, .login h1 a {
			background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 75"><g transform="translate(10, 8)"><circle cx="28" cy="28" r="26" fill="%230f172a"/><circle cx="28" cy="28" r="22" fill="%23c40012"/><path d="M18 28h20M28 18v20" stroke="%23ffffff" stroke-width="4.5" stroke-linecap="round"/><circle cx="28" cy="28" r="13" fill="none" stroke="%230f172a" stroke-width="2.5"/></g><text x="75" y="44" font-family="-apple-system, BlinkMacSystemFont, Montserrat, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="34" fill="%23050505" letter-spacing="-0.04em">screw<tspan fill="%23c40012">net</tspan><tspan font-size="20" font-weight="700" fill="%2371717a">.in</tspan></text><text x="77" y="62" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="9" fill="%2364748b" letter-spacing="3.5px">INDUSTRIAL FASTENERS</text></svg>') !important;
			height: 75px !important;
			width: 320px !important;
			background-size: contain !important;
			background-repeat: no-repeat !important;
			background-position: center !important;
			margin-bottom: 24px !important;
		}
		.login form {
			background: #ffffff !important;
			border: 1px solid #e2e8f0 !important;
			border-radius: 16px !important;
			box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08) !important;
			padding: 32px 28px !important;
		}
		.login label {
			font-weight: 600 !important;
			color: #334155 !important;
			font-size: 13px !important;
		}
		.login input[type="text"],
		.login input[type="password"] {
			border: 1px solid #cbd5e1 !important;
			border-radius: 8px !important;
			padding: 10px 14px !important;
			font-size: 14px !important;
			background: #f8fafc !important;
		}
		.login input[type="text"]:focus,
		.login input[type="password"]:focus {
			border-color: #0f172a !important;
			background: #ffffff !important;
			box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.12) !important;
		}
		.wp-core-ui .button-primary {
			background: #0f172a !important;
			border-color: #0f172a !important;
			color: #ffffff !important;
			text-shadow: none !important;
			box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2) !important;
			border-radius: 8px !important;
			font-weight: 700 !important;
			padding: 6px 20px !important;
			transition: all 150ms ease !important;
		}
		.wp-core-ui .button-primary:hover {
			background: #c40012 !important;
			border-color: #c40012 !important;
			box-shadow: 0 4px 14px rgba(196, 0, 18, 0.3) !important;
		}
		.login #nav a, .login #backtoblog a {
			color: #64748b !important;
			font-weight: 600 !important;
			font-size: 13px !important;
		}
		.login #nav a:hover, .login #backtoblog a:hover {
			color: #c40012 !important;
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

// =========================================================================
// 12. AUTOMATIC FRONTEND CACHE PURGE & ON-DEMAND REVALIDATION
// =========================================================================

add_action( 'save_post', 'screwnet_trigger_frontend_revalidation', 20, 3 );
function screwnet_trigger_frontend_revalidation( $post_id, $post, $update ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! is_object( $post ) || $post->post_status !== 'publish' ) {
		return;
	}

	$frontend_url = 'https://screwnet.in';
	$secret       = 'screwnet_revalidate_secret_2026';
	$slug         = $post->post_name;
	$post_type    = $post->post_type;

	$endpoint = $frontend_url . '/api/revalidate?secret=' . $secret;

	if ( $post_type === 'post' ) {
		$endpoint .= '&type=post&path=/blog&slug=' . urlencode( $slug );
	} elseif ( $post_type === 'product' ) {
		$endpoint .= '&type=product&path=/shop&slug=' . urlencode( $slug );
	} else {
		$endpoint .= '&path=/';
	}

	wp_remote_get( $endpoint, array(
		'timeout'   => 3,
		'blocking'  => false,
		'sslverify' => false,
	) );
}

add_action( 'acf/save_post', function ( $post_id ) {
	if ( $post_id === 'options' || $post_id === 'screwnet_storefront_options' ) {
		$endpoint = 'https://screwnet.in/api/revalidate?secret=screwnet_revalidate_secret_2026&path=/';
		wp_remote_get( $endpoint, array(
			'timeout'   => 3,
			'blocking'  => false,
			'sslverify' => false,
		) );
	}
}, 25 );

add_action( 'admin_bar_menu', function ( $wp_admin_bar ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$wp_admin_bar->add_node( array(
		'id'    => 'screwnet_purge_cache',
		'title' => '⚡ Sync Frontend Cache',
		'href'  => 'https://screwnet.in/api/revalidate?secret=screwnet_revalidate_secret_2026&redirect=admin',
		'meta'  => array(
			'title' => 'Purge frontend edge cache and immediately sync changes to screwnet.in',
		),
	) );
}, 100 );

