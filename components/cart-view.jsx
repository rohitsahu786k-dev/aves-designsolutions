"use client";

import Link from "next/link";
import { ArrowRight, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CouponOffers } from "@/components/coupon-offers";
import { addWishlistItem } from "@/components/wishlist-button";
import { cartSubtotal, couponDiscount, productUnitPrice } from "@/lib/coupon-utils";
import { createHandoffUrl, readAppliedCoupon, readCart, removeCartItem, setAppliedCoupon, updateCartItem } from "@/lib/cart-store";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

export function CartView() {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const update = () => {
      setItems(readCart());
      setCoupon(readAppliedCoupon());
    };
    update();
    fetch("/api/coupons")
      .then((response) => (response.ok ? response.json() : { coupons: [] }))
      .then((data) => setCoupons(data.coupons || []))
      .catch(() => setCoupons([]));

    window.addEventListener("screwnet:cart", update);
    window.addEventListener("screwnet:coupon", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("screwnet:cart", update);
      window.removeEventListener("screwnet:coupon", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const activeCoupon = useMemo(() => coupons.find((offer) => offer.code.toLowerCase() === coupon.toLowerCase()), [coupons, coupon]);
  const discount = useMemo(() => (activeCoupon ? couponDiscount(activeCoupon, items) : 0), [activeCoupon, items]);
  const minimumMet = subtotal >= 300;
  const progress = Math.min(100, (subtotal / 300) * 100);
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
  const checkoutUrl = useMemo(() => createHandoffUrl(items, coupon, "checkout"), [items, coupon]);

  function update(key, quantity) {
    if (quantity < 1) {
      removeCartItem(key);
    } else {
      updateCartItem(key, quantity);
    }
    setItems(readCart());
  }

  function remove(key) {
    removeCartItem(key);
    setItems(readCart());
  }

  function apply(code) {
    setAppliedCoupon(code);
    setCoupon(code);
  }

  return (
    <div className="container cart-page">
      <div className="page-hero">
        <span className="eyebrow">Fastener Order</span>
        <h1>Shopping Cart</h1>
        <p className="muted">Live quantities, real-time prices, offers and discounts connected directly to the store catalog.</p>
      </div>

      {!items.length ? (
        <div className="empty-state">
          <ShoppingBag size={42} />
          <h2>Your bag is currently empty</h2>
          <p className="muted">Discover our certified industrial screws, high-tensile bolts, and marine fasteners.</p>
          <Link className="button" href="/shop">
            Explore Store Catalog
          </Link>
        </div>
      ) : (
        <div className="checkout-layout premium-cart">
          <section className="cart-panel">
            <div className="cart-progress">
              <div>
                <span>{minimumMet ? "Minimum order unlocked for Checkout" : `Add ${money(300 - subtotal)} more to reach minimum order threshold`}</span>
                <strong>{Math.round(progress)}%</strong>
              </div>
              <i>
                <b style={{ width: `${progress}%` }} />
              </i>
            </div>

            {items.map((item) => {
              const unitPrice = productUnitPrice(item.product);
              const lineTotal = unitPrice * Number(item.quantity || 1);
              const moq = item.product?.acf_fields?.moq || 1;
              const step = item.product?.acf_fields?.quantityStep || 1;

              return (
                <article className="cart-item" key={item.key}>
                  <Link className="cart-item-image" href={`/product/${item.product.slug}`}>
                    {item.product.images?.[0]?.src ? (
                      <img src={item.product.images[0].src} alt={item.product.name} />
                    ) : (
                      <div className="cart-item-placeholder" />
                    )}
                  </Link>
                  <div className="cart-item-copy">
                    <small>{item.product.categories?.[0]?.name || "Industrial Fasteners"}</small>
                    <Link href={`/product/${item.product.slug}`}>
                      <h3>{item.product.name}</h3>
                    </Link>
                    {item.product.sku ? (
                      <span className="cart-sku-tag">SKU: {item.product.sku}</span>
                    ) : null}
                    {Object.entries(item.variationAttributes || {}).map(([key, value]) => (
                      <span key={key} className="cart-variant-tag">
                        {key.replace("attribute_pa_", "").replace("attribute_", "").replace(/-/g, " ")}: {value}
                      </span>
                    ))}
                    <div className="cart-price-line">
                      <span>{money(unitPrice)} each</span>
                      <strong>{money(lineTotal)}</strong>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-quantity">
                      <button
                        type="button"
                        onClick={() => update(item.key, item.quantity - step)}
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= moq}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => update(item.key, item.quantity + step)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-text-action"
                      onClick={() => {
                        addWishlistItem(item.product);
                        remove(item.key);
                      }}
                    >
                      <Heart size={14} /> Save for later
                    </button>
                    <button type="button" className="cart-text-action remove" onClick={() => remove(item.key)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </article>
              );
            })}

            <CouponOffers items={items} appliedCode={coupon} onApply={apply} />
          </section>

          <aside className="summary-panel premium-summary">
            <h2>Order Summary</h2>
            <div className="summary-line-group">
              <p>
                <span>Subtotal ({items.reduce((s, i) => s + Number(i.quantity || 1), 0)} items)</span>
                <strong>{money(subtotal)}</strong>
              </p>
              {discount > 0 ? (
                <p className="saving">
                  <span>
                    <Tag size={13} className="inline mr-1" /> Coupon ({coupon.toUpperCase()})
                  </span>
                  <strong>-{money(discount)}</strong>
                </p>
              ) : coupon ? (
                <p>
                  <span>Coupon</span>
                  <strong>{coupon.toUpperCase()} applied</strong>
                </p>
              ) : null}
              <p>
                <span>Estimated Shipping</span>
                <span>Calculated at Checkout</span>
              </p>
            </div>

            <div className="summary-total">
              <span>Grand Total</span>
              <strong>{money(total)}</strong>
            </div>

            {minimumMet ? (
              <a className="button full-width-checkout-btn" href={checkoutUrl}>
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </a>
            ) : (
              <button className="button full-width-checkout-btn" disabled>
                Minimum Order {money(300)}
              </button>
            )}

            <div className="summary-trust">
              <span>
                <ShieldCheck size={16} /> 100% Safe Checkout
              </span>
              <span>
                <Truck size={16} /> Pan-India Express Delivery
              </span>
            </div>
            <small className="summary-disclaimer">Final coupon validation, shipping, taxes and GST invoicing are completed securely at checkout.</small>
          </aside>
        </div>
      )}
    </div>
  );
}
