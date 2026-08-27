"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { decodeHtml } from "@/lib/utils";

export function HeroCarousel({ banners = [] }) {
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = banners.filter((b) => b && (b.desktopImage || b.mobileImage || b.image));

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return undefined;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [slides.length, isPaused]);

  if (!slides.length) return null;

  const goTo = (index) => setActive((index + slides.length) % slides.length);

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 45) goTo(active + 1);
    if (touchStart - touchEnd < -45) goTo(active - 1);
  };

  return (
    <section
      className="hero-carousel-section"
      aria-label="Store hero promotions"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-slides-wrapper">
        {slides.map((banner, index) => {
          const isActive = index === active;
          const desktop = banner.desktopImage || banner.image;
          const tablet = banner.tabletImage || desktop;
          const mobile = banner.mobileImage || desktop;
          const fallback = banner.fallbackImage || mobile;

          const heading = decodeHtml(banner.heading || banner.title || "");
          const eyebrow = decodeHtml(banner.eyebrow || "");
          const subheading = decodeHtml(banner.subheading || banner.text || "");
          const ctaLabel = decodeHtml(banner.ctaLabel || "Shop Now");
          const ctaUrl = banner.ctaUrl || banner.href || "/shop";

          const overlayOpacity = banner.overlayOpacity !== undefined ? banner.overlayOpacity / 100 : 0.45;
          const overlayColor = banner.overlayColor || "#0f172a";

          return (
            <article
              className={`hero-slide-item ${isActive ? "is-active" : ""}`}
              aria-hidden={!isActive}
              key={banner.id || index}
            >
              {/* Responsive Imagery */}
              <div className="hero-image-layer">
                <picture>
                  {mobile && <source media="(max-width: 640px)" srcSet={mobile} />}
                  {tablet && <source media="(max-width: 1024px)" srcSet={tablet} />}
                  <img
                    src={desktop || fallback}
                    alt={heading || "screwnet industrial fastener hero banner"}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="hero-bg-image"
                  />
                </picture>

                <div
                  className="hero-overlay-layer"
                  style={{
                    backgroundColor: overlayColor,
                    opacity: overlayOpacity,
                  }}
                />
              </div>

              {/* Text & Content Layer */}
              <div className="container hero-content-container">
                <div className={`hero-content-box align-${banner.textAlignment || "left"} theme-${banner.contentTheme || "light"}`}>
                  {eyebrow ? (
                    <div className="hero-eyebrow-tag">
                      <Sparkles size={13} />
                      <span>{eyebrow}</span>
                    </div>
                  ) : null}

                  {heading ? <h1 className="hero-main-heading">{heading}</h1> : null}
                  {subheading ? <p className="hero-subheading-text">{subheading}</p> : null}

                  {ctaLabel && ctaUrl ? (
                    <div className="hero-actions-row">
                      <Link
                        href={ctaUrl}
                        target={banner.openNewTab ? "_blank" : undefined}
                        rel={banner.openNewTab ? "noreferrer" : undefined}
                        className="button hero-cta-btn"
                        tabIndex={isActive ? 0 : -1}
                      >
                        <span>{ctaLabel}</span>
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {slides.length > 1 ? (
        <div className="hero-controls-bar">
          <div className="container hero-controls-inner">
            <div className="hero-dots-group">
              {slides.map((_, index) => (
                <button
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === active ? "true" : undefined}
                  onClick={() => goTo(index)}
                  key={index}
                  className={`hero-dot-indicator ${index === active ? "is-active" : ""}`}
                />
              ))}
            </div>

            <div className="hero-arrows-group">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous slide"
                className="hero-arrow-btn prev"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next slide"
                className="hero-arrow-btn next"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
