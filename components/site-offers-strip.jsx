"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Copy, Percent, Sparkles, Tag, Ticket } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

export function SiteOffersStrip({ offers = [] }) {
  const [copiedCode, setCopiedCode] = useState("");

  if (!Array.isArray(offers) || offers.length === 0) {
    return null;
  }

  function handleCopyCoupon(code) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2500);
  }

  return (
    <section className="section site-offers-section" aria-label="Exclusive Fastener Deals & Offers">
      <div className="container">
        <div className="offers-header-row">
          <div>
            <span className="eyebrow">Promotions & Volume Savings</span>
            <h2>Active Offers & Bulk Discount Coupons</h2>
          </div>
          <Link href="/shop?on_sale=true" className="offers-view-all-link">
            <span>View All Sale Hardware</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="site-offers-grid">
          {offers.map((offer) => {
            const isCopied = copiedCode === offer.couponCode;
            return (
              <div className="offer-promotion-card" key={offer.id}>
                {offer.badge ? (
                  <span className="offer-badge-tag">{offer.badge}</span>
                ) : (
                  <span className="offer-badge-tag">LIMITED DEAL</span>
                )}

                <div className="offer-card-body">
                  <h3>{offer.title}</h3>
                  {offer.description ? <p>{offer.description}</p> : null}

                  {offer.minimumOrderAmount > 0 ? (
                    <small className="offer-condition-note">
                      * On orders above ₹{offer.minimumOrderAmount.toLocaleString("en-IN")}
                    </small>
                  ) : null}
                </div>

                {offer.couponCode ? (
                  <div className="offer-coupon-box">
                    <span className="coupon-label">Coupon Code:</span>
                    <div className="coupon-code-pill">
                      <Ticket size={14} className="text-black" />
                      <strong>{offer.couponCode}</strong>
                      <button
                        type="button"
                        className="copy-coupon-btn"
                        onClick={() => handleCopyCoupon(offer.couponCode)}
                        aria-label={`Copy coupon ${offer.couponCode}`}
                        title="Copy coupon code"
                      >
                        {isCopied ? <Check size={14} className="text-black" /> : <Copy size={14} />}
                        <span>{isCopied ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {offer.ctaUrl ? (
                  <Link href={offer.ctaUrl} className="button button-outline offer-card-cta">
                    <span>{offer.ctaLabel || "Shop Eligible Fasteners"}</span>
                    <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
