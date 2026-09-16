import { WP_URL } from "@/lib/wp";

export const MINIMUM_ORDER_VALUE = 300;

const STORE_URL = (process.env.WOOCOMMERCE_SITE_URL || WP_URL).replace(/\/+$/, "");

function commerceAuthHeader() {
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";
  if (!key || !secret) return null;
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

export async function wooFetch(path, { method = "GET", body } = {}) {
  const auth = commerceAuthHeader();
  if (!auth) {
    return { ok: false, status: 500, data: { message: "Store credentials are not configured." } };
  }

  const response = await fetch(`${STORE_URL}/wp-json/wc/v3${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return { ok: false, status: 503, data: { message: "Store is unreachable. Please try again." } };
  }

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

// Headless bridge endpoints (screwnet/v1), used server-side to resolve a
// customer token into the WordPress user behind it.
export async function bridgeAuthFetch(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${STORE_URL}/wp-json/screwnet/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  }).catch(() => null);

  if (!response) return { ok: false, status: 503, data: {} };
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

// Store API is public and returns prices in minor units. Returns null when the
// store could not be reached, so callers can tell that apart from "not found".
export async function fetchStoreProducts(ids = []) {
  if (!ids.length) return [];
  const query = new URLSearchParams({ include: ids.join(","), per_page: String(Math.min(100, ids.length)) });
  const response = await fetch(`${STORE_URL}/wp-json/wc/store/v1/products?${query}`, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  const data = await response.json().catch(() => null);
  return Array.isArray(data) ? data : null;
}

export function storePrice(product) {
  const minor = product?.prices?.currency_minor_unit ?? 2;
  return Number(product?.prices?.price || 0) / Math.pow(10, minor);
}
