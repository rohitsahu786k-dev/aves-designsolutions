"use client";

import Link from "next/link";
import { ArrowRight, Box, ChevronRight, Disc, Layers, ShieldCheck, Wrench } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

const CATEGORY_META_MAP = {
  "allen-socket-head": { standard: "DIN 912", subtitle: "Grade 12.9 & SS304 Socket Cap", badge: "Precision Fit" },
  "allen-countersunk-csk": { standard: "DIN 7991", subtitle: "Flush Mounting Machine Screws", badge: "Flush Finish" },
  "bolts": { standard: "DIN 933 / 931", subtitle: "Grade 8.8 & 10.9 Structural Hex", badge: "High Tensile" },
  "flanged-combination-head": { standard: "SS 304", subtitle: "Washer Head Phillips / Slotted", badge: "Corrosion Proof" },
  "dome-nuts": { standard: "DIN 1587", subtitle: "SS304 Acorn Cap & Hex Locking", badge: "Aesthetic Cap" },
  "brass-inserts": { standard: "CNC Knurled", subtitle: "Heat-Set & Ultrasonic 3D/Plastic", badge: "High Grip" },
  "cross-phillips": { standard: "DIN 7985", subtitle: "Pan Head Metric Machine Screws", badge: "Everyday Fix" },
  "eye-bolts": { standard: "DIN 580", subtitle: "Forged Heavy Duty Rigging & Lifting", badge: "Heavy Lift" },
};

export function HomeCategoryMatrix({ categories = [] }) {
  const visible = categories
    .filter((c) => c.count > 0 && c.slug !== "uncategorized")
    .slice(0, 8);

  if (visible.length === 0) return null;

  return (
    <section className="section home-category-matrix-section">
      <div className="container">
        <div className="section-header-row">
          <div>
            <span className="eyebrow">ENGINEERING SPECIFICATIONS</span>
            <h2 className="section-main-heading">Shop by Head Style & Category</h2>
            <p className="section-sub-heading">
              Calibrated DIN/ISO metric fasteners available in SS304 stainless steel, high-tensile alloy steel, and CNC brass.
            </p>
          </div>
          <Link href="/shop" className="view-all-link">
            <span>Explore All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="category-matrix-grid">
          {visible.map((cat) => {
            const meta = CATEGORY_META_MAP[cat.slug] || {
              standard: "METRIC ISO",
              subtitle: "Industrial Standard Fasteners",
              badge: "In Stock",
            };

            return (
              <Link href={`/category/${cat.slug}`} key={cat.id} className="category-matrix-card">
                <div className="card-top-row">
                  <span className="cat-standard-badge">{meta.standard}</span>
                  <span className="cat-count-pill">{cat.count} items</span>
                </div>

                <div className="card-thumb-frame">
                  {cat.image?.src ? (
                    <img
                      src={cat.image.src}
                      alt={cat.image.alt || cat.name}
                      className="cat-thumb-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="cat-thumb-fallback">
                      <Wrench size={32} />
                    </div>
                  )}
                </div>

                <div className="card-body-content">
                  <span className="cat-sub-badge">{meta.badge}</span>
                  <h3 className="cat-title">{decodeHtml(cat.name)}</h3>
                  <p className="cat-desc">{meta.subtitle}</p>
                </div>

                <div className="card-footer-action">
                  <span>Browse Standard</span>
                  <ChevronRight size={15} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
