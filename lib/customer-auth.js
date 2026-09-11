const BASE_URL = (process.env.NEXT_PUBLIC_WP_URL || "https://wp.screwnet.in").replace(/\/+$/, "");
const AUTH_URL = `${BASE_URL}/wp-json/screwnet/v1/auth`;

const TOKEN_KEY = "screwnet_auth_token";
const USER_KEY = "screwnet_customer_user";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function authFetch(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${AUTH_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || "An error occurred with your request.";
    const err = new Error(message);
    err.status = response.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export async function loginCustomer(usernameOrEmail, password) {
  const data = await authFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      username: usernameOrEmail.trim(),
      password,
    }),
  });

  if (data.token) setStoredToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function registerCustomer({ email, password, first_name = "", last_name = "", phone = "" }) {
  const data = await authFetch("/register", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
    }),
  });

  if (data.token) setStoredToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function getCustomerProfile() {
  const data = await authFetch("/me", { method: "GET" });
  if (data.user) setStoredUser(data.user);
  return data.user;
}

export async function updateCustomerProfile({ first_name, last_name, email, current_password, new_password }) {
  const data = await authFetch("/update-profile", {
    method: "POST",
    body: JSON.stringify({
      first_name,
      last_name,
      email,
      current_password,
      new_password,
    }),
  });

  if (data.token) setStoredToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function updateCustomerAddress(type, address) {
  const data = await authFetch("/update-address", {
    method: "POST",
    body: JSON.stringify({
      type: type === "shipping" ? "shipping" : "billing",
      address,
    }),
  });

  if (data.user) setStoredUser(data.user);
  return data.user;
}

export async function getCustomerOrders() {
  const data = await authFetch("/orders", { method: "GET" });
  return data.orders || [];
}

export async function requestLostPassword(email) {
  return authFetch("/lost-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function sendVerificationCode(email, firstName = "") {
  return authFetch("/send-verification-code", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      first_name: firstName.trim(),
    }),
  });
}

export async function verifyCodeAndRegister({ email, code, password, first_name = "", last_name = "", phone = "" }) {
  const data = await authFetch("/verify-code", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      code: code.trim(),
      password,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
    }),
  });

  if (data.token) setStoredToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function trackOrderLookup({ orderNumber, identifier }) {
  const response = await fetch(`${BASE_URL}/wp-json/screwnet/v1/track-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_number: String(orderNumber).trim(),
      identifier: String(identifier).trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || "Failed to look up order tracking details.";
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return data;
}
