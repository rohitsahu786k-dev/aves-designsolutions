import Link from "next/link";
import { CheckCircle2, MapPin, PackageCheck, Truck } from "lucide-react";
import { wooFetch } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Confirmed | screwnet",
  robots: { index: false, follow: false },
};

const money = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value) || 0);

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function OrderConfirmationPage({ params, searchParams }) {
  const { id } = await params;
  const { key } = await searchParams;

  const { ok, data } = await wooFetch(`/orders/${Number(id) || 0}`);
  // The order key keeps confirmations private — order ids alone are guessable
  const order = ok && data?.order_key && data.order_key === key ? data : null;

  if (!order) {
    return (
      <div className="container">
        <div className="empty-state">
          <PackageCheck size={34} />
          <h2>Order not found</h2>
          <p className="muted">This confirmation link is invalid or has expired.</p>
          <Link className="button" href="/account">
            View your orders
          </Link>
        </div>
      </div>
    );
  }

  const address = order.shipping?.address_1 ? order.shipping : order.billing;

  return (
    <div className="container order-confirmation">
      <div className="order-confirm-hero">
        <CheckCircle2 size={44} />
        <h1>Thank you, your order is confirmed</h1>
        <p>
          Order <strong>#{order.number}</strong> placed on {formatDate(order.date_created)}. A confirmation has been sent
          to {order.billing?.email}.
        </p>
      </div>

      <div className="order-confirm-grid">
        <section className="order-confirm-card">
          <h2>Items</h2>
          <ul className="order-confirm-items">
            {(order.line_items || []).map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.name}</strong>
                  <small>Qty {item.quantity}</small>
                </span>
                <b>{money(item.total, order.currency)}</b>
              </li>
            ))}
          </ul>

          <div className="order-confirm-totals">
            {Number(order.discount_total) > 0 ? (
              <p className="saving">
                <span>Discount</span>
                <strong>-{money(order.discount_total, order.currency)}</strong>
              </p>
            ) : null}
            <p>
              <span>Shipping</span>
              <strong>{Number(order.shipping_total) > 0 ? money(order.shipping_total, order.currency) : "Free"}</strong>
            </p>
            <p className="grand">
              <span>Total payable</span>
              <strong>{money(order.total, order.currency)}</strong>
            </p>
          </div>
        </section>

        <aside className="order-confirm-card">
          <h2>Delivery</h2>
          <p className="order-confirm-address">
            <MapPin size={15} />
            <span>
              {address?.first_name} {address?.last_name}
              <br />
              {address?.address_1}
              {address?.address_2 ? `, ${address.address_2}` : ""}
              <br />
              {address?.city}, {address?.state} {address?.postcode}
              <br />
              {order.billing?.phone}
            </span>
          </p>

          <p className="order-confirm-meta">
            <Truck size={15} /> Payment: {order.payment_method_title || "Cash on Delivery"}
          </p>
          <p className="order-confirm-meta">
            <PackageCheck size={15} /> Status: {order.status}
          </p>

          <div className="order-confirm-actions">
            <Link className="button" href="/account">
              Track in my account
            </Link>
            <Link className="button button-outline" href="/shop">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
