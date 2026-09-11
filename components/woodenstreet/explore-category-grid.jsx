"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Grid, Wrench } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

export function ExploreCategoryGrid({ categories = [] }) {
  const visible = categories
    .filter((c) => c.slug !== "uncategorized")
    .slice(0, 8);

  if (visible.length === 0) return null;

  return (
    <section className="section wooden-explore-section">
      <div className="container">
        <div className="wooden-section-header">
          <div>
            <div className="wooden-section-tag">
              <Grid size={14} />
              <span>SHOP BY CATEGORY</span>
            </div>
            <h2 className="wooden-section-title">Shop By Category</h2>
            <p className="wooden-section-subtitle">
              Find the right screws, bolts, washers, anchors, and hardware by category.
            </p>
          </div>
          <Link prefetch={false} href="/shop" className="wooden-view-all-btn">
            <span>All Categories ({categories.length})</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="wooden-category-grid">
          {visible.map((cat) => (
            <Link prefetch={false} href={`/category/${cat.slug}`} key={cat.id} className="wooden-cat-card">
              <div className="wooden-cat-img-box">
                {cat.image?.src ? (
                  <img
                    src={cat.image.src}
                    alt={cat.image.alt || cat.name}
                    className="wooden-cat-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="wooden-cat-fallback">
                    <Wrench size={36} />
                  </div>
                )}
                <span className="wooden-cat-count">{Number(cat.count || 0) > 0 ? `${cat.count} Products` : "New Category"}</span>
              </div>
              <div className="wooden-cat-info">
                <h3 className="wooden-cat-name">{decodeHtml(cat.name)}</h3>
                <div className="wooden-cat-link">
                  <span>Explore Range</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
