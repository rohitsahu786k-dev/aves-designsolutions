import { cookies } from "next/headers";
import { WP_URL } from "@/lib/wp";

export const CUSTOMER_TOKEN_COOKIE = "screwnet_customer_token";

// Headless bridge tokens stay valid for 60 days
const TOKEN_MAX_AGE = 60 * 60 * 24 * 60;

export function customerCookieOptions(remember = true) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: TOKEN_MAX_AGE } : {}),
  };
}

export async function bridgeFetch(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${WP_URL}/wp-json/screwnet/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return { ok: false, status: 503, data: { message: "Account service is unreachable. Please try again." } };
  }

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function getCustomerToken() {
  const store = await cookies();
  return store.get(CUSTOMER_TOKEN_COOKIE)?.value || "";
}

export async function getCurrentCustomer() {
  const token = await getCustomerToken();
  if (!token) return null;
  const { ok, data } = await bridgeFetch("/auth/me", { token });
  return ok && data?.user ? data.user : null;
}

export async function getCustomerOrders() {
  const token = await getCustomerToken();
  if (!token) return [];
  const { ok, data } = await bridgeFetch("/auth/orders", { token });
  return ok && Array.isArray(data?.orders) ? data.orders : [];
}
