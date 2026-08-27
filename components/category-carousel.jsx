"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { decodeHtml } from "@/lib/utils";
import { WpImage } from "@/components/wp-image";

export function CategoryCarousel({ categories }) {
  const trackRef = useRef(null);
  const visible = categories.filter((category) => category.count > 0).slice(0, 18);

  function scroll(direction) {
    trackRef.current?.scrollBy({ left: direction * Math.max(320, trackRef.current.clientWidth * 0.72), behavior: "smooth" });
  }

  return (
    <section className="section category-section-wrapper" id="categories">
      <div className="container">
        <div className="section-title carousel-title">
          <div>
            <span className="eyebrow">Precision Hardware</span>
            <h2>Explore Fastener Categories</h2>
          </div>
          <div className="carousel-actions">
            <button type="button" onClick={() => scroll(-1)} aria-label="Previous categories">
              <ArrowLeft size={17} />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Next categories">
              <ArrowRight size={17} />
            </button>
            <Link href="/shop">View all</Link>
          </div>
        </div>
        <div className="scroll-row category-track" ref={trackRef}>
          {visible.map((category) => (
            <Link href={`/category/${category.slug}`} className="category-pill premium-circle-pill" key={category.id}>
              <span className="circle">
                {category.image?.src ? (
                  <WpImage src={category.image.src} alt={category.name} />
                ) : (
                  <span className="category-fallback">{category.name.slice(0, 1)}</span>
                )}
              </span>
                <strong>{decodeHtml(category.name)}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

