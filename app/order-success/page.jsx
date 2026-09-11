"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowRight, CheckCircle2, MessageSquare, PackageCheck, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { clearCart } from "@/lib/cart-store";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("id");
  const orderNumber = searchParams.get("orderNumber") || orderId;

  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Ensure cart is fully cleared
    clearCart();

    if (typeof window !== "undefined") {
      try {
        const stored = window.sessionStorage.getItem("screwnet_last_order");
        if (stored) {
          setOrderDetails(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to read order details:", err);
      }
    }
  }, []);

  const whatsappMessage = encodeURIComponent(
    `Hello Screwnet, I just placed Order #${orderNumber || orderId || ""}. Please confirm my order details and share shipment tracking.`
  );
  const whatsappUrl = `https://wa.me/918107753647?text=${whatsappMessage}`;

  return (
    <div className="container order-success-container">
      <div className="order-success-card">
        <div className="success-icon-wrapper">
          <CheckCircle2 size={56} className="success-icon" />
        </div>

        <span className="eyebrow success-eyebrow">Order Confirmed</span>
        <h1>Thank you for your order!</h1>
        <p className="order-success-subtitle">
          Your fastener order <strong>#{orderNumber || orderId || "Recorded"}</strong> has been received and is being prepared for express dispatch.
        </p>

        {orderDetails ? (
          <div className="order-receipt-summary">
            <div className="receipt-row">
              <span className="muted">Payment Method</span>
              <strong>Cash on Delivery (Pay upon delivery)</strong>
            </div>
            {orderDetails.customer?.name ? (
              <div className="receipt-row">
                <span className="muted">Customer Name</span>
                <strong>{orderDetails.customer.name}</strong>
              </div>
            ) : null}
            {orderDetails.shipping?.address ? (
              <div className="receipt-row">
                <span className="muted">Delivery Address</span>
                <span>{orderDetails.shipping.address}</span>
              </div>
            ) : null}
            {orderDetails.total ? (
              <div className="receipt-row receipt-total-row">
                <span>Total Amount Due</span>
                <strong className="order-total-amount">Rs. {Number(orderDetails.total).toFixed(2)}</strong>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="success-action-buttons">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button-whatsapp">
            <MessageSquare size={18} />
            <span>Get Order Updates on WhatsApp</span>
          </a>

          <Link href="/shop" className="button button-outline">
            <ShoppingBag size={18} />
            <span>Continue Shopping</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="success-trust-grid">
          <div className="trust-tile">
            <Truck size={20} />
            <h4>Express Dispatch</h4>
            <p>Orders are dispatched within 24 hours from our warehouse.</p>
          </div>
          <div className="trust-tile">
            <PackageCheck size={20} />
            <h4>Quality Inspected</h4>
            <p>Dimensional tolerance &amp; tensile strength verified.</p>
          </div>
          <div className="trust-tile">
            <ShieldCheck size={20} />
            <h4>Genuine GST Invoice</h4>
            <p>Original tax invoice with input credit included in package.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="container page-hero text-center"><h1>Loading order receipt...</h1></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
