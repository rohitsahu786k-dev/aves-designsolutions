"use client";

export const CART_STORAGE_KEY = "screwnet-cart-v1";
export const COUPON_STORAGE_KEY = "screwnet-coupon-v1";

export function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("screwnet:cart", { detail: items }));
}

export function openCartDrawer() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("screwnet:cart-open"));
}

export function addToCart(product, quantity = 1, variation = null) {
  const current = readCart();
  const key = variation?.id ? `${product.id}-${variation.id}` : `${product.id}`;
  const existingIndex = current.findIndex((item) => item.key === key);

  if (existingIndex > -1) {
    current[existingIndex].quantity += quantity;
  } else {
    current.push({
      key,
      product,
      quantity,
      variation,
      variationAttributes: variation?.attributes || {},
    });
  }

  writeCart(current);
  openCartDrawer();
  return current;
}

export const addCartItem = addToCart;

export function updateQuantity(key, quantity) {
  const current = readCart();
  const updated = current
    .map((item) => (item.key === key ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  writeCart(updated);
  return updated;
}

export const updateCartItem = updateQuantity;

export function removeFromCart(key) {
  const current = readCart();
  const updated = current.filter((item) => item.key !== key);
  writeCart(updated);
  return updated;
}

export const removeCartItem = removeFromCart;

export function clearCart() {
  writeCart([]);
  clearCoupon();
}

export function readCoupon() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COUPON_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readAppliedCoupon() {
  const c = readCoupon();
  return c?.code || (typeof c === "string" ? c : "");
}

export function writeCoupon(coupon) {
  if (typeof window === "undefined") return;
  const normalized = coupon
    ? typeof coupon === "string"
      ? { code: coupon.trim().toUpperCase() }
      : { ...coupon, code: String(coupon.code || "").trim().toUpperCase() }
    : null;

  if (!normalized) {
    window.localStorage.removeItem(COUPON_STORAGE_KEY);
  } else {
    window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(normalized));
  }
  window.dispatchEvent(new CustomEvent("screwnet:coupon", { detail: normalized }));
}

export function setAppliedCoupon(code) {
  if (!code) {
    writeCoupon(null);
  } else {
    writeCoupon({ code: String(code).trim().toUpperCase() });
  }
}

export function clearCoupon() {
  writeCoupon(null);
}

function checkoutBaseUrl() {
  return process.env.NEXT_PUBLIC_WP_URL || "https://slateblue-frog-836232.hostingersite.com";
}

export function buildWooCommerceCheckoutUrl(items = [], coupon = null, redirect = "checkout") {
  if (!items.length) {
    return `${checkoutBaseUrl()}/checkout/`;
  }

  const payload = {
    items: items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      variation_id: item.variation?.id || 0,
      variation: item.variation?.attributes || [],
    })),
    coupon: typeof coupon === "string" ? coupon.trim().toUpperCase() : coupon?.code ? String(coupon.code).trim().toUpperCase() : "",
    redirect,
    timestamp: Date.now(),
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${checkoutBaseUrl()}/?screwnet_cart_handoff=${encoded}`;
}

export const createHandoffUrl = buildWooCommerceCheckoutUrl;

export function getCartCount() {
  return readCart().reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
}
