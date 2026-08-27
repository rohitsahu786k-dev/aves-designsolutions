"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole, PackageCheck, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { cartSubtotal } from "@/lib/coupon-utils";
import { createHandoffUrl, readAppliedCoupon, readCart } from "@/lib/cart-store";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export function CheckoutHandoff() {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { setItems(readCart()); setCoupon(readAppliedCoupon()); });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const subtotal = cartSubtotal(items);
  const checkoutUrl = createHandoffUrl(items, coupon, "checkout");

  if (!items.length) return <div className="empty-state"><ShoppingBag size={34} /><h2>Your bag is empty</h2><p className="muted">Add products before starting checkout.</p><Link className="button" href="/shop">Explore products</Link></div>;

  return (
    <div className="checkout-layout checkout-handoff">
      <section className="checkout-review">
        <h2>Ready for secure checkout</h2>
        <p>Your bag will be transferred to WooCommerce. Delivery address, shipping, coupon validation and Nimbbl payment are completed there.</p>
        <div className="checkout-review-items">{items.map((item) => <div key={item.key}>{item.product.images?.[0]?.src ? <img src={item.product.images[0].src} alt="" /> : null}<span><strong>{item.product.name}</strong><small>Quantity {item.quantity}</small></span></div>)}</div>
      </section>
      <aside className="summary-panel premium-summary">
        <h2>Checkout summary</h2>
        <p><span>Items</span><strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong></p>
        <p><span>Subtotal</span><strong>{money(subtotal)}</strong></p>
        {coupon ? <p><span>Coupon</span><strong>{coupon.toUpperCase()}</strong></p> : null}
        {subtotal >= 300 ? <a className="button" href={checkoutUrl}><LockKeyhole size={17} /> Continue securely <ArrowRight size={17} /></a> : <Link className="button" href="/cart">Minimum order is Rs. 300</Link>}
        <div className="summary-trust"><span><ShieldCheck size={16} /> Nimbbl secure payment</span><span><PackageCheck size={16} /> WooCommerce order receipt</span></div>
      </aside>
    </div>
  );
}
