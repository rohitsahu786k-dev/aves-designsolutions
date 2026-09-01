"use client";

import Link from "next/link";
import { ArrowRight, FileSpreadsheet, MessageCircle, Percent, Phone, ShieldCheck, Truck } from "lucide-react";

export function BulkRfqBanner({ whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918107753647", phoneDisplay = "+91 81077 53647" }) {
  const rfqText = encodeURIComponent("Hello screwnet B2B Desk! I would like to request a bulk wholesale quotation for fastener requirements (BOM).");
  const whatsappRfqUrl = `https://wa.me/${whatsappNumber}?text=${rfqText}`;

  return (
    <section className="section bulk-rfq-section" style={{ margin: "3rem 0" }}>
      <div className="container">
        <div
          style={{
            background: "#000000",
            borderRadius: "12px",
            padding: "3rem 2.5rem",
            color: "#fff",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2.5rem",
            alignItems: "center",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.6)",
            border: "1px solid #27272a",
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#18181b", border: "1px solid #27272a", padding: "0.35rem 0.75rem", borderRadius: "4px", color: "#ffffff", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "1rem" }}>
              <Percent size={14} /> Wholesale Contractor Rates
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#fff", margin: "0 0 0.75rem", lineHeight: "1.2" }}>
              Need Bulk Quantities or Master Cartons?
            </h2>
            <p style={{ color: "#a1a1aa", fontSize: "0.95rem", lineHeight: "1.6", margin: "0 0 1.5rem" }}>
              Get extra volume discounts up to <strong>15% OFF</strong> on structural bolts, self-drilling screws, and anchor fasteners with same-day GST tax invoicing and freight priority.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <a
                href={whatsappRfqUrl}
                target="_blank"
                rel="noreferrer"
                className="button"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#ffffff",
                  color: "#000000",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: "700",
                  borderRadius: "4px",
                }}
              >
                <MessageCircle size={17} /> WhatsApp Instant RFQ ({phoneDisplay})
              </a>
              <Link href="/pages/bulk-orders" className="button button-outline" style={{ color: "#fff", borderColor: "#3f3f46", backgroundColor: "transparent", borderRadius: "4px" }}>
                View Bulk Tiers <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ backgroundColor: "#18181b", padding: "1.25rem", borderRadius: "6px", border: "1px solid #27272a" }}>
              <FileSpreadsheet size={24} style={{ color: "#ffffff", marginBottom: "0.5rem" }} />
              <strong style={{ display: "block", fontSize: "1rem", color: "#fff", marginBottom: "0.25rem" }}>Send BOM List</strong>
              <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Upload Excel or PDF fastener schedules</span>
            </div>

            <div style={{ backgroundColor: "#18181b", padding: "1.25rem", borderRadius: "6px", border: "1px solid #27272a" }}>
              <ShieldCheck size={24} style={{ color: "#ffffff", marginBottom: "0.5rem" }} />
              <strong style={{ display: "block", fontSize: "1rem", color: "#fff", marginBottom: "0.25rem" }}>MTC Reports</strong>
              <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Mill test certificates available on request</span>
            </div>

            <div style={{ backgroundColor: "#18181b", padding: "1.25rem", borderRadius: "6px", border: "1px solid #27272a" }}>
              <Truck size={24} style={{ color: "#ffffff", marginBottom: "0.5rem" }} />
              <strong style={{ display: "block", fontSize: "1rem", color: "#fff", marginBottom: "0.25rem" }}>Direct Dispatch</strong>
              <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Express shipping from Udaipur central hub</span>
            </div>

            <div style={{ backgroundColor: "#18181b", padding: "1.25rem", borderRadius: "6px", border: "1px solid #27272a" }}>
              <Phone size={24} style={{ color: "#ffffff", marginBottom: "0.5rem" }} />
              <strong style={{ display: "block", fontSize: "1rem", color: "#fff", marginBottom: "0.25rem" }}>Direct Engineer Call</strong>
              <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Technical support Mon-Sat (9am - 6:00pm)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
