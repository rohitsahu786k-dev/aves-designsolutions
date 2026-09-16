"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, LockKeyhole, PackageCheck, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { cartSubtotal, couponDiscount, productUnitPrice } from "@/lib/coupon-utils";
import { checkoutLineItems, clearCart, readAppliedCoupon, readCart } from "@/lib/cart-store";

const MINIMUM_ORDER_VALUE = 300;

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

// WooCommerce state codes for India — Woo stores the code, not the label
const INDIAN_STATES = [
  ["AN", "Andaman and Nicobar Islands"], ["AP", "Andhra Pradesh"], ["AR", "Arunachal Pradesh"], ["AS", "Assam"],
  ["BR", "Bihar"], ["CH", "Chandigarh"], ["CT", "Chhattisgarh"], ["DH", "Dadra and Nagar Haveli and Daman and Diu"],
  ["DL", "Delhi"], ["GA", "Goa"], ["GJ", "Gujarat"], ["HR", "Haryana"], ["HP", "Himachal Pradesh"],
  ["JK", "Jammu and Kashmir"], ["JH", "Jharkhand"], ["KA", "Karnataka"], ["KL", "Kerala"], ["LA", "Ladakh"],
  ["LD", "Lakshadweep"], ["MP", "Madhya Pradesh"], ["MH", "Maharashtra"], ["MN", "Manipur"], ["ML", "Meghalaya"],
  ["MZ", "Mizoram"], ["NL", "Nagaland"], ["OD", "Odisha"], ["PY", "Puducherry"], ["PB", "Punjab"],
  ["RJ", "Rajasthan"], ["SK", "Sikkim"], ["TN", "Tamil Nadu"], ["TS", "Telangana"], ["TR", "Tripura"],
  ["UP", "Uttar Pradesh"], ["UK", "Uttarakhand"], ["WB", "West Bengal"],
];

export function CheckoutForm({ prefill, signedIn = false }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState([]);
  const [address, setAddress] = useState(prefill);
  const [note, setNote] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(readCart());
      setCoupon(readAppliedCoupon());
      setLoaded(true);
    });
    fetch("/api/coupons")
      .then((response) => (response.ok ? response.json() : { coupons: [] }))
      .then((data) => setCoupons(data.coupons || []))
      .catch(() => setCoupons([]));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const discount = useMemo(() => {
    const active = coupons.find((entry) => entry.code?.toUpperCase() === coupon?.toUpperCase());
    return active ? couponDiscount(active, items) : 0;
  }, [coupons, coupon, items]);
  const total = Math.max(0, subtotal - discount);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const minimumMet = subtotal >= MINIMUM_ORDER_VALUE;

  function update(field, value) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    setInvalidFields([]);

    if (!minimumMet) {
      setError(`Minimum order value is ${money(MINIMUM_ORDER_VALUE)}.`);
      return;
    }

    setPlacing(true);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: checkoutLineItems(items),
        coupon,
        billing: address,
        customer_note: note,
      }),
    }).catch(() => null);

    const data = await response?.json().catch(() => ({}));

    if (!response?.ok) {
      setPlacing(false);
      setInvalidFields(data?.fields || []);
      setError(data?.message || "Order could not be placed. Please try again.");
      return;
    }

    clearCart();
    router.push(`/order/${data.id}?key=${encodeURIComponent(data.key)}`);
  }

  if (loaded && !items.length) {
    return (
      <div className="empty-state">
        <ShoppingBag size={34} />
        <h2>Your bag is empty</h2>
        <p className="muted">Add products before starting checkout.</p>
        <Link className="button" href="/shop">
          Explore products
        </Link>
      </div>
    );
  }

  const fieldClass = (name) => `form-field ${invalidFields.includes(name) ? "has-error" : ""}`;

  return (
    <form className="checkout-layout storefront-checkout" onSubmit={placeOrder}>
      <section className="checkout-details">
        <h2>Delivery details</h2>
        {signedIn ? <p className="checkout-signed-in">Signed in — this order will be saved to your account.</p> : null}
        {error ? <p className="account-alert error">{error}</p> : null}

        <div className="checkout-field-grid">
          <div className={fieldClass("first_name")}>
            <label htmlFor="co-first-name">First Name *</label>
            <input id="co-first-name" value={address.first_name} onChange={(e) => update("first_name", e.target.value)} autoComplete="given-name" required />
          </div>
          <div className={fieldClass("last_name")}>
            <label htmlFor="co-last-name">Last Name *</label>
            <input id="co-last-name" value={address.last_name} onChange={(e) => update("last_name", e.target.value)} autoComplete="family-name" required />
          </div>
          <div className={fieldClass("email")}>
            <label htmlFor="co-email">Email *</label>
            <input id="co-email" type="email" value={address.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" required />
          </div>
          <div className={fieldClass("phone")}>
            <label htmlFor="co-phone">Mobile Number *</label>
            <input id="co-phone" type="tel" inputMode="numeric" value={address.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" required />
          </div>
          <div className="form-field wide">
            <label htmlFor="co-company">Company / GST Name</label>
            <input id="co-company" value={address.company} onChange={(e) => update("company", e.target.value)} autoComplete="organization" />
          </div>
          <div className={`${fieldClass("address_1")} wide`}>
            <label htmlFor="co-address-1">Address Line 1 *</label>
            <input id="co-address-1" value={address.address_1} onChange={(e) => update("address_1", e.target.value)} autoComplete="address-line1" required />
          </div>
          <div className="form-field wide">
            <label htmlFor="co-address-2">Address Line 2</label>
            <input id="co-address-2" value={address.address_2} onChange={(e) => update("address_2", e.target.value)} autoComplete="address-line2" />
          </div>
          <div className={fieldClass("city")}>
            <label htmlFor="co-city">City *</label>
            <input id="co-city" value={address.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" required />
          </div>
          <div className={fieldClass("state")}>
            <label htmlFor="co-state">State *</label>
            <select id="co-state" value={address.state} onChange={(e) => update("state", e.target.value)} required>
              <option value="">Select state</option>
              {INDIAN_STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldClass("postcode")}>
            <label htmlFor="co-postcode">Pincode *</label>
            <input id="co-postcode" inputMode="numeric" maxLength={6} value={address.postcode} onChange={(e) => update("postcode", e.target.value)} autoComplete="postal-code" required />
          </div>
          <div className="form-field">
            <label htmlFor="co-country">Country</label>
            <input id="co-country" value="India" readOnly />
          </div>
          <div className="form-field wide">
            <label htmlFor="co-note">Order Notes</label>
            <textarea id="co-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery instructions, GST number, site contact…" />
          </div>
        </div>

        <h2 className="checkout-payment-heading">Payment</h2>
        <div className="checkout-payment-option">
          <BadgeIndianRupee size={20} />
          <div>
            <strong>Cash on Delivery</strong>
            <small>Pay the courier when your fasteners arrive. No advance payment required.</small>
          </div>
        </div>
      </section>

      <aside className="summary-panel premium-summary checkout-summary">
        <h2>Order summary</h2>
        <div className="checkout-summary-items">
          {items.map((item) => (
            <div key={item.key}>
              {item.product.images?.[0]?.src ? <img src={item.product.images[0].src} alt="" /> : <span className="thumb-fallback" />}
              <span>
                <strong>{item.product.name}</strong>
                <small>
                  {item.quantity} × {money(productUnitPrice(item.product))}
                </small>
              </span>
              <b>{money(productUnitPrice(item.product) * Number(item.quantity || 1))}</b>
            </div>
          ))}
        </div>

        <p>
          <span>Items</span>
          <strong>{itemCount}</strong>
        </p>
        <p>
          <span>Subtotal</span>
          <strong>{money(subtotal)}</strong>
        </p>
        {discount > 0 ? (
          <p className="saving">
            <span>Coupon ({coupon.toUpperCase()})</span>
            <strong>-{money(discount)}</strong>
          </p>
        ) : null}
        <p>
          <span>Shipping</span>
          <strong>Free</strong>
        </p>
        <div className="summary-total">
          <span>Payable</span>
          <strong>{money(total)}</strong>
        </div>

        {minimumMet ? (
          <button className="button" type="submit" disabled={placing}>
            <LockKeyhole size={17} /> {placing ? "Placing order…" : "Place order"}
          </button>
        ) : (
          <Link className="button" href="/cart">
            Minimum order is {money(MINIMUM_ORDER_VALUE)}
          </Link>
        )}

        <div className="summary-trust">
          <span>
            <ShieldCheck size={16} /> Secure on-site checkout
          </span>
          <span>
            <PackageCheck size={16} /> Verified order receipt
          </span>
          <span>
            <Truck size={16} /> Pan-India despatch
          </span>
        </div>
      </aside>
    </form>
  );
}
