"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, ShieldCheck, Sparkles, Wrench } from "lucide-react";

export function PromoOfferGrid() {
  const promos = [
    {
      badge: "STAINLESS SERIES",
      title: "SS304 & SS316 Marine Fasteners",
      subtitle: "Rust-proof austenitic screws & flanged combination bolts for solar & outdoor framing.",
      cta: "Shop Stainless Range",
      href: "/shop?search=SS304",
      highlight: "Grade A2-70 / A4-80",
    },
    {
      badge: "HIGH TENSILE",
      title: "Grade 10.9 & 12.9 Alloy Steel",
      subtitle: "Precision socket head cap screws & structural hex bolts rated up to 1220 MPa tensile strength.",
      cta: "Shop High-Tensile",
      href: "/category/allen-socket-head",
      highlight: "DIN 912 / ISO 4762",
    },
    {
      badge: "B2B WHOLESALE",
      title: "Master Carton Volume Rates",
      subtitle: "Contractor pricing tiers for packs of 500, 2000 & 5000 pcs with instant 18% GST invoice.",
      cta: "Get Wholesale Quote",
      href: "/contact",
      highlight: "Pan-India Freight Priority",
    },
  ];

  return (
    <section className="section wooden-promo-section">
      <div className="container">
        <div className="wooden-promo-grid">
          {promos.map((promo, idx) => (
            <div key={idx} className="wooden-promo-card">
              <div className="wooden-promo-top">
                <span className="wooden-promo-badge">{promo.badge}</span>
                <span className="wooden-promo-highlight">{promo.highlight}</span>
              </div>
              <div className="wooden-promo-content">
                <h3 className="wooden-promo-title">{promo.title}</h3>
                <p className="wooden-promo-desc">{promo.subtitle}</p>
              </div>
              <Link href={promo.href} className="wooden-promo-cta">
                <span>{promo.cta}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
