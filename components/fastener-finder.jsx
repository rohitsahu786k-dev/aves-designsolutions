"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Cog, Layers, ShieldCheck, Sparkles, Wrench } from "lucide-react";

const FASTENER_TYPES = [
  {
    id: "self-drilling",
    name: "Self-Drilling (Tek) Screws",
    tagline: "Point #1 to #5 • Drills into thick steel without pilot holes",
    specs: "Hardened Carbon Steel & Bi-Metal • Zinc / Ruspert Plated",
    badge: "Most Popular",
    href: "/shop?search=self+drilling",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "drywall-screws",
    name: "Drywall Screws (Bugle Head)",
    tagline: "Coarse & Fine Thread • Black Phosphate / Zinc Finish",
    specs: "Sizes: 3.5x25mm to 4.8x100mm • High Tensile Core",
    badge: "High Stock",
    href: "/shop?search=drywall",
    image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "hex-bolts",
    name: "Hex Head Bolts (Grade 8.8 & 10.9)",
    tagline: "DIN 931 / DIN 933 • High Tensile Structural Fastening",
    specs: "Metric M6 to M30 • Hot-Dip Galvanized & Zinc Plated",
    badge: "Heavy Duty",
    href: "/shop?search=hex+bolt",
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "socket-cap",
    name: "Socket Head Cap Screws (Allen Bolts)",
    tagline: "DIN 912 / ISO 4762 • Ultra-High Tensile Grade 12.9",
    specs: "Metric M3 to M24 • 1220 MPa Ultimate Tensile Strength",
    badge: "Grade 12.9",
    href: "/shop?search=socket+cap",
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "stainless-steel",
    name: "SS 304 & SS 316 Marine Fasteners",
    tagline: "A2-70 & A4-80 Austenitic Stainless Steel Hardware",
    specs: "Zero Rust • Pitting Resistant in Marine & Chemical Zones",
    badge: "Corrosion Proof",
    href: "/shop?search=stainless",
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "concrete-anchors",
    name: "Concrete Wedge & Sleeve Anchors",
    tagline: "Heavy-Duty Masonry Anchors with Heavy Shear Capacity",
    specs: "Carbon Steel Zinc & SS 316 • Sizes: M6 to M20",
    badge: "Structural",
    href: "/shop?search=anchor",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  },
];

export function FastenerFinder() {
  const [activeTab, setActiveTab] = useState(FASTENER_TYPES[0].id);
  const activeItem = FASTENER_TYPES.find((t) => t.id === activeTab) || FASTENER_TYPES[0];

  return (
    <section className="section fastener-finder-section" style={{ backgroundColor: "#000000", color: "#fff", padding: "4rem 0", borderRadius: "12px", margin: "2.5rem 0", border: "1px solid #27272a" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 2.5rem" }}>
          <span style={{ color: "#a1a1aa", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Precision Industrial Selection
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800", color: "#fff", margin: "0.5rem 0 0.75rem", letterSpacing: "-0.02em" }}>
            Explore Fasteners by Engineering Type
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "0.95rem", lineHeight: "1.6" }}>
            Select your application to find DIN/ISO compliant screws, bolts, and anchors with guaranteed tensile ratings and bulk contractor packs.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "2rem" }}>
          {FASTENER_TYPES.map((type) => {
            const isActive = activeTab === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveTab(type.id)}
                style={{
                  padding: "0.6rem 1.1rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: isActive ? "1px solid #ffffff" : "1px solid #27272a",
                  backgroundColor: isActive ? "#ffffff" : "#18181b",
                  color: isActive ? "#000000" : "#a1a1aa",
                  transition: "all 0.2s ease",
                }}
              >
                {type.name}
              </button>
            );
          })}
        </div>

        {/* Active Type Showcase Card */}
        <div
          style={{
            backgroundColor: "#18181b",
            borderRadius: "8px",
            border: "1px solid #27272a",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            alignItems: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ padding: "2.5rem" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#27272a",
                color: "#ffffff",
                padding: "0.3rem 0.75rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: "700",
                textTransform: "uppercase",
                marginBottom: "1rem",
                border: "1px solid #3f3f46",
              }}
            >
              {activeItem.badge}
            </span>
            <h3 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#fff", margin: "0 0 0.75rem" }}>{activeItem.name}</h3>
            <p style={{ color: "#d4d4d8", fontSize: "1rem", lineHeight: "1.6", marginBottom: "1rem" }}>{activeItem.tagline}</p>
            <div style={{ backgroundColor: "#09090b", padding: "1rem", borderRadius: "6px", border: "1px solid #27272a", marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ffffff", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>
                <ShieldCheck size={16} /> Engineering Specs:
              </div>
              <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: 0 }}>{activeItem.specs}</p>
            </div>
            <Link
              href={activeItem.href}
              className="button"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#ffffff",
                color: "#000000",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontWeight: "700",
                fontSize: "0.95rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "4px",
              }}
            >
              Browse All {activeItem.name} <ArrowRight size={16} />
            </Link>
          </div>
          <div style={{ height: "100%", minHeight: "280px" }}>
            <img
              src={activeItem.image}
              alt={activeItem.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
