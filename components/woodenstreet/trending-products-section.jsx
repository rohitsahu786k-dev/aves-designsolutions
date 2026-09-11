"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { ProductCard } from "@/components/product-card";

export function TrendingProductsSection({
  products = [],
  popularProducts = [],
  shelves = [],
  initialTab = "trending",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    {
      id: "trending",
      label: "Best Sellers",
      products: popularProducts.length ? popularProducts.slice(0, 8) : products.slice(0, 8),
      href: "/shop?orderby=popularity",
    },
    {
      id: "new",
      label: "New Arrivals",
      products: products.slice(0, 8),
      href: "/shop?orderby=date",
    },
  ];

  shelves.forEach(({ category, products: catProducts }) => {
    if (catProducts && catProducts.length > 0) {
      tabs.push({
        id: `tab-${category.slug}`,
        label: category.name,
        products: catProducts.slice(0, 8),
        href: `/category/${category.slug}`,
      });
    }
  });

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="section wooden-trending-section">
      <div className="container">
        {/* Section Header */}
        <div className="wooden-section-header">
          <div>
            <div className="wooden-section-tag">
              <Flame size={14} />
              <span>NEW & POPULAR</span>
            </div>
            <h2 className="wooden-section-title">New Arrivals</h2>
            <p className="wooden-section-subtitle">
              Freshly added products, ready stock picks, and fast-moving essentials for your next order.
            </p>
          </div>
          <Link prefetch={false} href={currentTab.href} className="wooden-view-all-btn">
            <span>View All {currentTab.label}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Tab Navigation Strip */}
        <div className="wooden-tabs-nav">
          {tabs.map((tab) => {
            const isSelected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                className={`wooden-tab-pill ${isSelected ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="wooden-products-grid">
          {currentTab.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
