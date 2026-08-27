"use client";

import Link from "next/link";

export function TextMarquee({ text = "MINIMUM ORDER RS. 300 | SECURE NIMBBL CHECKOUT | PAN INDIA DELIVERY" }) {
  const items = Array(6).fill(text);

  return (
    <div className="text-marquee-bar" aria-label="Store Announcements">
      <div className="text-marquee-track">
        {items.map((item, index) => (
          <span key={index} className="marquee-item">
            <Link href="/shop">{item}</Link>
            <span className="marquee-separator">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
