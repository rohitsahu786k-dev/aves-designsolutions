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

export function addToCart(product, quantity = 1, variation = null, { openDrawer = true } = {}) {
  const current = readCart();
  const variationId = Number(variation?.id || variation?.variationId || 0);
  const amount = Math.max(1, Number(quantity) || 1);
  const key = variationId ? `${product.id}-${variationId}` : `${product.id}`;
  const existingIndex = current.findIndex((item) => item.key === key);

  if (existingIndex > -1) {
    current[existingIndex].quantity = (Number(current[existingIndex].quantity) || 0) + amount;
  } else {
    current.push({
      key,
      product,
      quantity: amount,
      variation,
      variationId,
      variationAttributes: variation?.attributes || {},
    });
  }

  writeCart(current);
  if (openDrawer) openCartDrawer();
  return current;
}

export const addCartItem = addToCart;

export function updateQuantity(key, quantity) {
  const current = readCart();
  const updated = current
    .map((item) => (item.key === key ? { ...item, quantity: Number(quantity) || 0 } : item))
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

// Line items in the shape /api/checkout forwards to WooCommerce.
// Prices are never sent from the browser — WooCommerce prices the order itself.
export function checkoutLineItems(items = []) {
  return items
    .map((item) => ({
      productId: Number(item.product?.id || 0),
      variationId: Number(item.variationId || item.variation?.id || 0),
      quantity: Math.max(1, Number(item.quantity) || 1),
    }))
    .filter((line) => line.productId > 0);
}

// Adds the item without opening the drawer; the caller routes to /checkout
export function buyNow(product, quantity = 1, variation = null) {
  return addToCart(product, quantity, variation, { openDrawer: false });
}


export function getCartCount() {
  return readCart().reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
}
