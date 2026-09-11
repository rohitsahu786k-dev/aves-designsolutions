"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  HelpCircle,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { cartSubtotal, couponDiscount } from "@/lib/coupon-utils";
import { clearCart, readAppliedCoupon, readCart } from "@/lib/cart-store";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Chandigarh"
];

const money = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val || 0);

export function NativeCheckoutForm() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGstEnabled, setIsGstEnabled] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    street: "",
    landmark: "",
    city: "",
    state: "Rajasthan",
    pincode: "",
    companyName: "",
    gstNumber: "",
    customerNote: "",
  });

  useEffect(() => {
    setItems(readCart());
    const code = readAppliedCoupon();
    if (code) setCouponCode(code);

    // Fetch active coupons to calculate discount
    fetch("/api/coupons")
      .then((res) => (res.ok ? res.json() : { coupons: [] }))
      .then((data) => setCoupons(data.coupons || []))
      .catch(() => setCoupons([]));
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const activeCoupon = useMemo(
    () => coupons.find((c) => c.code.toLowerCase() === (couponCode || "").toLowerCase()),
    [coupons, couponCode]
  );
  const discount = useMemo(() => (activeCoupon ? couponDiscount(activeCoupon, items) : 0), [activeCoupon, items]);
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
  const minimumMet = subtotal >= 300;

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!minimumMet) {
      setErrorMessage("Minimum order value is Rs. 300. Please add more items to your bag.");
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!formData.street.trim()) {
      setErrorMessage("Please enter your flat / house / street address.");
      return;
    }

    if (!formData.city.trim()) {
      setErrorMessage("Please enter your city.");
      return;
    }

    const cleanPincode = formData.pincode.replace(/[^0-9]/g, "");
    if (cleanPincode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (isGstEnabled && !formData.gstNumber.trim()) {
      setErrorMessage("Please enter your GSTIN number or uncheck the GST invoice option.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer: {
          fullName: formData.fullName.trim(),
          phone: cleanPhone,
          email: formData.email.trim(),
        },
        address: {
          street: formData.street.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          state: formData.state,
          pincode: cleanPincode,
        },
        items: items.map((item) => ({
          productId: item.product?.id,
          variationId: item.variationId || item.variation?.id || 0,
          quantity: item.quantity,
        })),
        coupon: activeCoupon ? { code: activeCoupon.code } : null,
        gst: isGstEnabled
          ? {
              companyName: formData.companyName.trim(),
              number: formData.gstNumber.trim().toUpperCase(),
            }
          : null,
        paymentMethod: "cod",
        customerNote: formData.customerNote.trim(),
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create order. Please check your details.");
      }

      // Store order details in session storage for the success page
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("screwnet_last_order", JSON.stringify(result));
      }

      // Clear the cart
      clearCart();

      // Redirect to native order success page
      router.push(`/order-success?orderId=${result.orderId}&orderNumber=${result.orderNumber}`);
    } catch (err) {
      console.error("Order submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <ShoppingBag size={48} className="muted" />
        <h2>Your shopping bag is empty</h2>
        <p className="muted">Add fastener products to your bag to proceed with checkout.</p>
        <Link className="button" href="/shop">
          Explore Warehouse Catalog <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="native-checkout-container">
      <form onSubmit={handlePlaceOrder} className="native-checkout-layout">
        {/* Left Column: Form Fields */}
        <div className="checkout-form-main">
          {errorMessage ? (
            <div className="checkout-alert checkout-alert-error" role="alert">
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {/* Section 1: Customer Contact */}
          <div className="checkout-step-card">
            <div className="step-header">
              <span className="step-badge">1</span>
              <div>
                <h2>Contact Information</h2>
                <p className="muted">We will send order confirmation and tracking details here.</p>
              </div>
            </div>

            <div className="checkout-form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="fullName">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">
                  Phone Number (WhatsApp) <span className="required">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="checkout-step-card">
            <div className="step-header">
              <span className="step-badge">2</span>
              <div>
                <h2>Delivery Address</h2>
                <p className="muted">Where should we deliver your fasteners?</p>
              </div>
            </div>

            <div className="checkout-form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="street">
                  Flat / House / Factory / Street Address <span className="required">*</span>
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  required
                  placeholder="Plot No., Factory Shed, Street or Industrial Area"
                  value={formData.street}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="landmark">Landmark / Area (Optional)</label>
                <input
                  id="landmark"
                  name="landmark"
                  type="text"
                  placeholder="Near Post Office, Road No. 4, etc."
                  value={formData.landmark}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="city">
                  City / Town <span className="required">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  placeholder="e.g. Udaipur"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="state">
                  State <span className="required">*</span>
                </label>
                <select id="state" name="state" value={formData.state} onChange={handleInputChange}>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="pincode">
                  PIN Code <span className="required">*</span>
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  required
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="country">Country</label>
                <input id="country" type="text" disabled value="India" className="input-disabled" />
              </div>
            </div>
          </div>

          {/* Section 3: Optional GST & Business Invoicing */}
          <div className="checkout-step-card">
            <div className="gst-toggle-header">
              <label className="gst-checkbox-label">
                <input
                  type="checkbox"
                  checked={isGstEnabled}
                  onChange={(e) => setIsGstEnabled(e.target.checked)}
                />
                <span className="checkbox-custom" />
                <span className="gst-label-text">
                  <strong>Add GST Number for Tax Invoice (Business Purchase)</strong>
                  <small className="block muted">Claim input tax credit on this order.</small>
                </span>
              </label>
            </div>

            {isGstEnabled ? (
              <div className="checkout-form-grid gst-fields mt-3">
                <div className="form-field">
                  <label htmlFor="companyName">Company / Firm Name</label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Registered Company Name"
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="gstNumber">
                    GSTIN Number <span className="required">*</span>
                  </label>
                  <input
                    id="gstNumber"
                    name="gstNumber"
                    type="text"
                    placeholder="15-digit GSTIN (e.g. 08AAAAA0000A1Z5)"
                    maxLength={15}
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Section 4: Payment Method */}
          <div className="checkout-step-card">
            <div className="step-header">
              <span className="step-badge">3</span>
              <div>
                <h2>Payment Method</h2>
                <p className="muted">Safe and verified payment mode.</p>
              </div>
            </div>

            <div className="payment-options-list">
              <label className="payment-option-card active">
                <input type="radio" name="paymentMethod" value="cod" defaultChecked />
                <div className="payment-option-info">
                  <div className="payment-title">
                    <strong>Cash on Delivery (COD)</strong>
                    <span className="badge-pill badge-green">Recommended</span>
                  </div>
                  <p className="muted">
                    Pay with Cash, UPI, or QR code to the delivery courier when your order arrives at your doorstep. Zero advance required.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <aside className="checkout-summary-sidebar">
          <div className="summary-sticky-card">
            <h2>Order Summary ({items.reduce((sum, item) => sum + item.quantity, 0)} Items)</h2>

            <div className="summary-products-scroll">
              {items.map((item) => {
                const img = item.product?.images?.[0]?.src || item.variation?.image?.src;
                const unitPrice = item.variation?.prices?.price || item.product?.prices?.price || 0;
                const minor = item.product?.prices?.currency_minor_unit ?? 2;
                const itemTotal = (Number(unitPrice) / Math.pow(10, minor)) * item.quantity;

                return (
                  <div key={item.key} className="summary-product-item">
                    <div className="summary-product-thumb">
                      {img ? <img src={img} alt="" /> : <div className="no-thumb" />}
                      <span className="summary-qty-badge">{item.quantity}</span>
                    </div>
                    <div className="summary-product-details">
                      <h4>{item.product?.name}</h4>
                      {item.variation?.attributes ? (
                        <small className="muted block">
                          {Object.values(item.variation.attributes).join(", ")}
                        </small>
                      ) : null}
                      <span className="summary-product-price">{money(itemTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="summary-calculations">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              {discount > 0 ? (
                <div className="summary-row saving">
                  <span>
                    <Tag size={14} className="inline mr-1" /> Coupon ({couponCode.toUpperCase()})
                  </span>
                  <strong>-{money(discount)}</strong>
                </div>
              ) : null}

              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping-text">FREE Pan-India Express</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row grand-total-row">
                <span>Total Amount Due</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            {minimumMet ? (
              <button type="submit" disabled={loading} className="button full-width-checkout-btn">
                {loading ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <LockKeyhole size={18} />
                    <span>Place Order ({money(total)})</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            ) : (
              <div className="minimum-order-warning">
                <p>Minimum order value is {money(300)}.</p>
                <Link href="/shop" className="button button-outline full-width">
                  Add more items ({money(300 - subtotal)} needed)
                </Link>
              </div>
            )}

            <div className="checkout-trust-badges">
              <div className="trust-item">
                <ShieldCheck size={16} /> <span>100% Genuine Certified Fasteners</span>
              </div>
              <div className="trust-item">
                <Truck size={16} /> <span>Same-Day Dispatch &amp; Live Tracking</span>
              </div>
              <div className="trust-item">
                <ReceiptText size={16} /> <span>GST Input Tax Invoice Included</span>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
