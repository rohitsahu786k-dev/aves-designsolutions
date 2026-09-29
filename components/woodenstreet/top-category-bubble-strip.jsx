"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { decodeHtml } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react";

export function TopCategoryBubbleStrip({ categories = [] }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const visible = categories.filter((c) => c.slug !== "uncategorized");

  const syncArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 4);
    setCanScrollRight(track.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    syncArrows();
    const track = trackRef.current;
    if (!track) return undefined;
    track.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      track.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [syncArrows, visible.length]);

  if (visible.length === 0) return null;

  function scroll(direction) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(280, track.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <div className="wooden-bubble-strip" aria-label="Quick Category Navigation">
      <div className="container wooden-bubble-shell">
        <button
          type="button"
          className={`wooden-bubble-arrow prev ${canScrollLeft ? "" : "is-hidden"}`}
          onClick={() => scroll(-1)}
          aria-label="Scroll categories left"
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="wooden-bubble-track" ref={trackRef}>
          {visible.map((cat) => (
            <Link prefetch={false} href={`/category/${cat.slug}`} key={cat.id} className="wooden-bubble-item">
              <div className="wooden-bubble-circle">
                {cat.image?.src ? (
                  <img
                    src={cat.image.src}
                    alt={cat.image.alt || cat.name}
                    className="wooden-bubble-img"
                    loading="eager"
                  />
                ) : (
                  <div className="wooden-bubble-fallback">
                    <Wrench size={22} />
                  </div>
                )}
              </div>
              <span className="wooden-bubble-label">{decodeHtml(cat.name)}</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          className={`wooden-bubble-arrow next ${canScrollRight ? "" : "is-hidden"}`}
          onClick={() => scroll(1)}
          aria-label="Scroll categories right"
          tabIndex={canScrollRight ? 0 : -1}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
