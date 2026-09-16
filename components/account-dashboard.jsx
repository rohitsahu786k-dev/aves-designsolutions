"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LogOut,
  MapPin,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";

const ADDRESS_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "company", label: "Company" },
  { key: "phone", label: "Phone" },
  { key: "address_1", label: "Address Line 1", wide: true },
  { key: "address_2", label: "Address Line 2", wide: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "postcode", label: "Pincode" },
  { key: "country", label: "Country" },
];

function money(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function orderDate(value) {
  if (!value) return "";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AccountDashboard({ customer, orders = [] }) {
  const router = useRouter();
  const [view, setView] = useState("orders");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState({
    first_name: customer.first_name || "",
    last_name: customer.last_name || "",
    email: customer.email || "",
    current_password: "",
    new_password: "",
  });
  const [addressType, setAddressType] = useState("billing");
  const [addresses, setAddresses] = useState({
    billing: { ...customer.billing },
    shipping: { ...customer.shipping },
  });

  function switchView(next) {
    setView(next);
    setError("");
    setNotice("");
  }

  async function post(endpoint, payload) {
    setBusy(true);
    setError("");
    setNotice("");

    const response = await fetch(`/api/account/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    const data = await response?.json().catch(() => ({}));
    setBusy(false);

    if (!response?.ok) {
      setError(data?.message || "Something went wrong. Please try again.");
      return null;
    }

    setNotice(data?.message || "Saved.");
    return data;
  }

  async function handleProfile(event) {
    event.preventDefault();
    const data = await post("profile", profile);
    if (data) {
      setProfile({ ...profile, current_password: "", new_password: "" });
      router.refresh();
    }
  }

  async function handleAddress(event) {
    event.preventDefault();
    const data = await post("address", { type: addressType, address: addresses[addressType] });
    if (data) router.refresh();
  }

  async function handleLogout() {
    setBusy(true);
    await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
    setBusy(false);
    router.refresh();
  }

  function updateAddress(key, value) {
    setAddresses({ ...addresses, [addressType]: { ...addresses[addressType], [key]: value } });
  }

  return (
    <div className="account-dashboard">
      <div className="account-dashboard-header">
        <div>
          <span className="eyebrow">Customer Portal</span>
          <h1>Hello, {customer.first_name || customer.display_name || "there"}</h1>
          <p>{customer.email}</p>
        </div>
        <button type="button" className="account-logout-btn" onClick={handleLogout} disabled={busy}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      <div className="account-stat-row">
        <div className="account-stat">
          <ShoppingBag size={18} />
          <strong>{orders.length || customer.order_count || 0}</strong>
          <span>Orders placed</span>
        </div>
        <div className="account-stat">
          <MapPin size={18} />
          <strong>{customer.billing?.city || "--"}</strong>
          <span>Billing city</span>
        </div>
        <div className="account-stat">
          <ShieldCheck size={18} />
          <strong>Active</strong>
          <span>Account status</span>
        </div>
      </div>

      <div className="account-view-tabs">
        <button type="button" className={view === "orders" ? "active" : ""} onClick={() => switchView("orders")}>
          <PackageSearch size={16} /> My Orders
        </button>
        <button type="button" className={view === "profile" ? "active" : ""} onClick={() => switchView("profile")}>
          <UserRound size={16} /> Profile
        </button>
        <button type="button" className={view === "address" ? "active" : ""} onClick={() => switchView("address")}>
          <MapPin size={16} /> Addresses
        </button>
      </div>

      {error && <p className="account-alert error">{error}</p>}
      {notice && <p className="account-alert success">{notice}</p>}

      {view === "orders" && (
        <div className="account-panel">
          {orders.length === 0 ? (
            <div className="account-empty">
              <PackageSearch size={28} />
              <p>You have not placed any orders yet.</p>
              <Link className="button" href="/shop">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="account-order-list">
              {orders.map((order) => (
                <article className="account-order-card" key={order.id}>
                  <header>
                    <div>
                      <strong>Order #{order.number}</strong>
                      <span>{orderDate(order.date)}</span>
                    </div>
                    <span className={`account-order-status status-${order.status}`}>{order.status_name}</span>
                  </header>

                  <ul className="account-order-items">
                    {(order.line_items || []).map((item) => (
                      <li key={item.id}>
                        {item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <span className="thumb-fallback" />}
                        <div>
                          {item.slug ? <Link href={`/product/${item.slug}`}>{item.name}</Link> : <span>{item.name}</span>}
                          <small>Qty {item.quantity}</small>
                        </div>
                        <strong>{money(item.total, order.currency)}</strong>
                      </li>
                    ))}
                  </ul>

                  <footer>
                    <span>{order.payment_method || "Payment pending"}</span>
                    <strong>{money(order.total, order.currency)}</strong>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "profile" && (
        <div className="account-panel">
          <form className="account-form-grid" onSubmit={handleProfile}>
            <div className="account-field-row">
              <div className="form-field">
                <label htmlFor="profile-first-name">First Name</label>
                <input
                  id="profile-first-name"
                  type="text"
                  value={profile.first_name}
                  onChange={(event) => setProfile({ ...profile, first_name: event.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="profile-last-name">Last Name</label>
                <input
                  id="profile-last-name"
                  type="text"
                  value={profile.last_name}
                  onChange={(event) => setProfile({ ...profile, last_name: event.target.value })}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              />
            </div>

            <div className="account-field-row">
              <div className="form-field">
                <label htmlFor="profile-current-password">Current Password</label>
                <input
                  id="profile-current-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Only to change password"
                  value={profile.current_password}
                  onChange={(event) => setProfile({ ...profile, current_password: event.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="profile-new-password">New Password</label>
                <input
                  id="profile-new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={profile.new_password}
                  onChange={(event) => setProfile({ ...profile, new_password: event.target.value })}
                />
              </div>
            </div>

            <button className="button account-submit-btn" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {view === "address" && (
        <div className="account-panel">
          <div className="account-address-switch">
            <button
              type="button"
              className={addressType === "billing" ? "active" : ""}
              onClick={() => setAddressType("billing")}
            >
              Billing Address
            </button>
            <button
              type="button"
              className={addressType === "shipping" ? "active" : ""}
              onClick={() => setAddressType("shipping")}
            >
              Shipping Address
            </button>
          </div>

          <form className="account-form-grid" onSubmit={handleAddress}>
            <div className="account-address-grid">
              {ADDRESS_FIELDS.map((field) => (
                <div className={`form-field ${field.wide ? "wide" : ""}`} key={field.key}>
                  <label htmlFor={`address-${field.key}`}>{field.label}</label>
                  <input
                    id={`address-${field.key}`}
                    type="text"
                    value={addresses[addressType]?.[field.key] || ""}
                    onChange={(event) => updateAddress(field.key, event.target.value)}
                  />
                </div>
              ))}
            </div>

            <button className="button account-submit-btn" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save Address"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
