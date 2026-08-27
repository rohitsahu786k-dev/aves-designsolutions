"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";

export function HomeProductTabs({
  allProducts = [],
  popularProducts = [],
  shelves = [],
}) {
  const [activeTab, setActiveTab] = useState("featured");

  // Prepare tab data
  const tabs = [
    { id: "featured", label: "Featured Fasteners", products: popularProducts.length ? popularProducts.slice(0, 8) : allProducts.slice(0, 8), href: "/shop" },
    { id: "latest", label: "New Additions", products: allProducts.slice(0, 8), href: "/shop?orderby=date" },
  ];

  // Add individual category shelves as tabs if they have products
  shelves.forEach(({ category, products }) => {
    if (products && products.length > 0) {
      tabs.push({
        id: `cat-${category.slug}`,
        label: category.name,
        products: products.slice(0, 8),
        href: `/category/${category.slug}`,
      });
    }
  });

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="section home-product-tabs-section">
      <div className="container">
        <div className="tab-header-row">
          <div>
            <span className="eyebrow">LIVE WAREHOUSE INVENTORY</span>
            <h2 className="section-main-heading">Explore Fasteners by Line</h2>
          </div>
          <Link href={currentTab.href} className="view-all-link">
            <span>View All {currentTab.label}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Tab Buttons */}
        <div className="tabs-nav-track">
          {tabs.map((tab) => {
            const isSelected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-filter-btn ${isSelected ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="product-tab-grid">
          {currentTab.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
