"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Mail,
  MapPin,
  ExternalLink,
  Phone,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck
} from "lucide-react";
import { trackOrderLookup } from "@/lib/customer-auth";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "";
  const initialIdent = searchParams.get("identifier") || searchParams.get("email") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [identifier, setIdentifier] = useState(initialIdent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [copiedAwb, setCopiedAwb] = useState(false);

  // Auto-search if query parameters are present on load
  useEffect(() => {
    if (initialOrder && initialIdent) {
      performTracking(initialOrder, initialIdent);
    }
  }, [initialOrder, initialIdent]);

  async function performTracking(ord, ident) {
    if (!ord || !ident) {
      setError("Please provide both your order number and billing email or phone.");
      return;
    }
    setError("");
    setLoading(true);
    setTrackingData(null);

    try {
      const data = await trackOrderLookup({ orderNumber: ord, identifier: ident });
      setTrackingData(data);
    } catch (err) {
      setError(err.message || "Could not find order. Please verify your details.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    performTracking(orderNumber, identifier);
  }

  function handleCopy(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  }

  // Milestones definition
  const milestones = [
    {
      step: 1,
      title: "Order Confirmed",
      desc: "Order received & verified",
      icon: CheckCircle2,
    },
    {
      step: 2,
      title: "Packaging & QA",
      desc: "Fasteners picked & verified",
      icon: Clock,
    },
    {
      step: 3,
      title: "Dispatched",
      desc: "Handed to courier partner",
      icon: Truck,
    },
    {
      step: 4,
      title: "Delivered",
      desc: "Package delivered safely",
      icon: PackageCheck,
    },
  ];

  const currentStep = trackingData?.current_step || 1;

  return (
    <div className="track-order-page-wrapper">
      <style jsx>{`
        .track-order-page-wrapper {
          max-width: 1000px;
          margin: 32px auto 72px;
          padding: 0 16px;
          box-sizing: border-box;
        }
        .track-search-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 16px;
          align-items: flex-end;
        }
        .track-milestones-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          position: relative;
        }
        .track-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .track-order-page-wrapper {
            margin: 16px auto 48px;
            padding: 0 12px;
          }
          .track-search-form {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .track-search-btn {
            width: 100%;
            justify-content: center;
          }
          .track-milestones-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .track-two-col {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .track-header-banner {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 20px 16px !important;
          }
          .track-status-update {
            text-align: left !important;
          }
        }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "#71717a", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Link href="/" style={{ color: "#71717a", textDecoration: "none" }}>Home</Link>
        <span>/</span>
        <span style={{ color: "#000000", fontWeight: "700" }}>Track Order</span>
      </div>

      {/* Page Header */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#f4f4f5",
          color: "#000000",
          border: "1px solid #d4d4d8",
          padding: "6px 14px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "12px"
        }}>
          <Truck size={14} /> Live Shipment Tracking
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#000000", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
          Track Your Fastener Order
        </h1>
        <p style={{ fontSize: "15px", color: "#71717a", maxWidth: "560px", margin: "0 auto" }}>
          Check real-time dispatch progress, courier tracking details, and estimated delivery status.
        </p>
      </div>

      {/* Search Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e4e4e7",
        borderRadius: "16px",
        padding: "28px 32px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        marginBottom: "32px",
        boxSizing: "border-box",
      }}>
        <form onSubmit={handleSubmit} className="track-search-form">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="track-order-num" style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000" }}>
              Order Number
            </label>
            <div style={{ position: "relative" }}>
              <Package size={17} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#71717a" }} />
              <input
                id="track-order-num"
                type="text"
                placeholder="e.g. 1042 or #1042"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px 0 42px",
                  border: "1px solid #d4d4d8",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#000000",
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="track-ident" style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000" }}>
              Billing Email or Phone
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={17} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#71717a" }} />
              <input
                id="track-ident"
                type="text"
                placeholder="name@example.com or 10-digit phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px 0 42px",
                  border: "1px solid #d4d4d8",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#000000",
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="track-search-btn"
            style={{
              height: "46px",
              padding: "0 28px",
              background: "#000000",
              color: "#ffffff",
              border: "1px solid #000000",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              transition: "background 150ms ease",
            }}
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            <span>{loading ? "Searching..." : "Track Order"}</span>
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: "20px",
            padding: "14px 18px",
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "10px",
            color: "#ffffff",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, color: "#ffffff" }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Results View */}
      {trackingData && (
        <div className="fade-in" style={{ display: "grid", gap: "24px" }}>
          {/* Order Header Card */}
          <div className="track-header-banner" style={{
            background: "#000000",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "24px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            border: "1px solid #27272a",
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "12px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>
                Order Summary
              </div>
              <div style={{ fontSize: "24px", fontWeight: "900", marginTop: "2px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                #{trackingData.order_number}
                <span style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  background: "#18181b",
                  color: "#ffffff",
                  border: "1px solid #3f3f46",
                }}>
                  {trackingData.status_name || trackingData.status}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "#d4d4d8", marginTop: "4px", wordBreak: "break-word" }}>
                Placed on {trackingData.date_created} &bull; Total: <strong>₹{Number(trackingData.total).toFixed(2)}</strong> ({trackingData.payment_method})
              </div>
            </div>

            <div className="track-status-update" style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>
                Current Status
              </div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", maxWidth: "340px", marginTop: "2px" }}>
                {trackingData.status_message}
              </div>
            </div>
          </div>

          {/* Visual Milestone Progress Tracker */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
            boxSizing: "border-box",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#000000", margin: "0 0 28px" }}>
              Fulfillment Progress
            </h3>

            <div className="track-milestones-grid">
              {milestones.map((m) => {
                const isPassed = currentStep >= m.step && currentStep !== -1;
                const isCurrent = currentStep === m.step;
                const Icon = m.icon;

                return (
                  <div key={m.step} style={{ textAlign: "center", position: "relative" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      margin: "0 auto 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isPassed
                        ? "#000000"
                        : "#f4f4f5",
                      color: isPassed ? "#ffffff" : "#a1a1aa",
                      boxShadow: isCurrent ? "0 4px 14px rgba(0, 0, 0, 0.25)" : "none",
                      border: `2px solid ${isPassed ? "#000000" : "#e4e4e7"}`,
                      transition: "all 200ms ease",
                    }}>
                      <Icon size={22} />
                    </div>

                    <div style={{ fontSize: "14px", fontWeight: isCurrent ? "900" : "700", color: isPassed ? "#000000" : "#a1a1aa" }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#71717a", marginTop: "2px" }}>
                      {m.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier & Tracking Details Card (AST) */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "16px",
            padding: "28px 32px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
            boxSizing: "border-box",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#000000", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Truck size={18} color="#000000" /> Courier Dispatch Details
            </h3>

            {trackingData.tracking_items && trackingData.tracking_items.length > 0 ? (
              <div style={{ display: "grid", gap: "16px" }}>
                {trackingData.tracking_items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#fafafa",
                      border: "1px solid #e4e4e7",
                      borderRadius: "12px",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#71717a" }}>
                        Courier Partner
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "900", color: "#000000", marginTop: "2px" }}>
                        {item.provider}
                      </div>
                      {item.date_shipped && (
                        <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                          Shipped on: {item.date_shipped}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      {item.tracking_number && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "8px 14px", borderRadius: "8px", border: "1px solid #d4d4d8" }}>
                          <span style={{ fontSize: "12px", color: "#71717a" }}>AWB:</span>
                          <strong style={{ fontSize: "14px", color: "#000000", fontFamily: "Consolas, Monaco, monospace" }}>
                            {item.tracking_number}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.tracking_number)}
                            title="Copy AWB Number"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#000000", padding: "2px", display: "flex" }}
                          >
                            {copiedAwb ? <Check size={15} color="#000000" /> : <Copy size={15} />}
                          </button>
                        </div>
                      )}

                      {item.tracking_link && (
                        <a
                          href={item.tracking_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#000000",
                            color: "#ffffff",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "700",
                            textDecoration: "none",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                          }}
                        >
                          <span>Track on {item.provider}</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: "#fafafa",
                border: "1px dashed #d4d4d8",
                borderRadius: "12px",
                padding: "20px 24px",
                color: "#27272a",
                fontSize: "13px",
                lineHeight: "1.6",
              }}>
                <strong>Courier Assignment in Progress:</strong> Your fasteners are being packed at our Udaipur facility. Once dispatched, your courier tracking number (AWB) and direct tracking link from Delhivery / BlueDart will appear here automatically.
              </div>
            )}
          </div>

          {/* Shipping Address & Support Grid */}
          <div className="track-two-col">
            {/* Delivery Destination */}
            <div style={{
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "16px",
              padding: "24px",
              boxSizing: "border-box",
            }}>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#000000", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={16} color="#000000" /> Delivery Destination
              </h4>
              <div style={{ fontSize: "13px", color: "#27272a", lineHeight: "1.7", wordBreak: "break-word" }}>
                <strong>{trackingData.shipping_address?.name}</strong><br />
                {trackingData.shipping_address?.address}<br />
                {trackingData.shipping_address?.city}, {trackingData.shipping_address?.state} {trackingData.shipping_address?.postcode}<br />
                India
              </div>
            </div>

            {/* Support Box */}
            <div style={{
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "16px",
              padding: "24px",
              boxSizing: "border-box",
            }}>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#000000", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Phone size={16} color="#000000" /> Need Assistance?
              </h4>
              <p style={{ fontSize: "13px", color: "#71717a", margin: "0 0 12px", lineHeight: "1.6" }}>
                For questions regarding delivery timelines or bulk transport dispatch:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <a href="tel:+919251859361" style={{ color: "#000000", textDecoration: "none", fontWeight: "800" }}>
                  📞 +91 9251859361
                </a>
                <a href="mailto:sales@screwnet.in" style={{ color: "#000000", textDecoration: "none", fontWeight: "800" }}>
                  ✉️ sales@screwnet.in
                </a>
              </div>
            </div>
          </div>

          {/* Items in Order */}
          {trackingData.items && trackingData.items.length > 0 && (
            <div style={{
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "16px",
              padding: "24px 32px",
              boxSizing: "border-box",
            }}>
              <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#000000", margin: "0 0 16px" }}>
                Items in This Shipment ({trackingData.items.length})
              </h4>
              <div style={{ display: "grid", gap: "12px" }}>
                {trackingData.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px dashed #e4e4e7", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e4e4e7", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Package size={16} color="#000000" />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#000000", wordBreak: "break-word" }}>{item.name}</div>
                        <div style={{ fontSize: "12px", color: "#71717a" }}>Quantity: <b>{item.quantity}</b></div>
                      </div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "#000000", whiteSpace: "nowrap" }}>
                      ₹{Number(item.total).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trust Badge Footer */}
      <div style={{ marginTop: "40px", textAlign: "center", fontSize: "12px", color: "#71717a", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        <ShieldCheck size={16} color="#000000" />
        <span>screwnet Quality Guaranteed &bull; Fasteners Shipped Directly from Udaipur, Rajasthan</span>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "#71717a", gap: "12px" }}>
        <RefreshCw className="animate-spin" size={20} />
        <span>Loading order tracker...</span>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
