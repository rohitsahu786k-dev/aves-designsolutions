"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, PackageCheck, ShoppingBag, Zap } from "lucide-react";
import { decodeHtml, formatPrice } from "@/lib/utils";

export function StickyBuyBar({ product }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when scrolled past 500px on mobile/desktop
      if (window.scrollY > 500) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!product || !visible) return null;

  const title = decodeHtml(product.name);
  const price = formatPrice(product.prices);
  const imgSrc = product.images?.[0]?.src || product.images?.[0]?.source_url || "";

  function scrollToPurchase(e) {
    e.preventDefault();
    const target = document.getElementById("product-purchase-box");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <aside className="pdp-sticky-bottom-bar" aria-label="Quick Purchase Bar">
      <div className="sticky-bar-container">
        <div className="sticky-bar-product-col">
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="sticky-bar-thumb" />
          ) : null}
          <div className="sticky-bar-meta">
            <strong className="sticky-bar-title" title={title}>{title}</strong>
            <div className="sticky-bar-sub">
              <span className="sticky-bar-price">{price}</span>
              {product.is_in_stock ? (
                <span className="sticky-bar-stock">
                  <span className="stock-dot" /> In Stock
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="sticky-bar-cta-col">
          <button
            type="button"
            className="button sticky-bar-btn"
            onClick={scrollToPurchase}
          >
            <ShoppingBag size={15} />
            <span>{product.has_options ? "Select Size / Add to Cart" : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
