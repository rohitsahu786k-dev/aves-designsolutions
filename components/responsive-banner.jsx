import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

export function ResponsiveBanner({ banner, className = "" }) {
  if (!banner || (!banner.desktopImage && !banner.mobileImage)) {
    return null;
  }

  const desktop = banner.desktopImage;
  const tablet = banner.tabletImage || desktop;
  const mobile = banner.mobileImage || desktop;

  const heading = decodeHtml(banner.heading || "");
  const eyebrow = decodeHtml(banner.eyebrow || "");
  const subheading = decodeHtml(banner.subheading || "");
  const ctaLabel = decodeHtml(banner.ctaLabel || "Learn More");
  const ctaUrl = banner.ctaUrl || "/shop";

  const overlayOpacity = banner.overlayOpacity !== undefined ? banner.overlayOpacity / 100 : 0.5;
  const overlayColor = banner.overlayColor || "#0f172a";

  return (
    <section className={`responsive-banner-section ${className}`} aria-label={heading || "Promotional Banner"}>
      <div className="container">
        <div className="responsive-banner-card">
          <picture className="banner-picture-frame">
            {mobile && <source media="(max-width: 640px)" srcSet={mobile} />}
            {tablet && <source media="(max-width: 1024px)" srcSet={tablet} />}
            <img
              src={desktop || mobile}
              alt={heading || "screwnet banner"}
              loading="lazy"
              className="banner-cover-img"
            />
          </picture>

          <div
            className="banner-overlay-tint"
            style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
          />

          <div className="banner-text-overlay">
            {eyebrow ? (
              <div className="banner-eyebrow-pill">
                <Sparkles size={12} />
                <span>{eyebrow}</span>
              </div>
            ) : null}

            {heading ? <h2 className="banner-heading-text">{heading}</h2> : null}
            {subheading ? <p className="banner-subheading-text">{subheading}</p> : null}

            {ctaUrl && ctaLabel ? (
              <Link
                href={ctaUrl}
                target={banner.openNewTab ? "_blank" : undefined}
                rel={banner.openNewTab ? "noreferrer" : undefined}
                className="button banner-cta-button"
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
