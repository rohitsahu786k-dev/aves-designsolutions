"use client";

import { ChevronLeft, ChevronRight, Compass, FileText, Image as ImageIcon, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function getImgSrc(img) {
  if (!img) return null;
  if (typeof img === "string") return img;
  return img.src || img.source_url || img.url || img.full || img.medium || null;
}

function sameImage(a, b) {
  if (!a || !b) return false;
  return Boolean((a.id && b.id && String(a.id) === String(b.id)) || (a.src && b.src && a.src === b.src));
}

export function ProductGallery({ images = [], dimensionDrawing = "", name = "Fastener", productId }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Touch swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const validImages = images
    .map((img) => ({
      src: getImgSrc(img),
      alt: img?.alt || name,
      id: img?.id || getImgSrc(img),
      isDrawing: false,
    }))
    .filter((img) => img.src);

  if (dimensionDrawing && !validImages.some((img) => img.src === dimensionDrawing)) {
    validImages.push({
      src: dimensionDrawing,
      alt: `${name} Technical Dimension Blueprint Drawing`,
      id: "dimension-drawing",
      isDrawing: true,
    });
  }

  const current = validImages[active] || validImages[0];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!productId) return undefined;
    const handleVariationImage = (event) => {
      if (String(event.detail?.productId) !== String(productId)) return;
      const image = event.detail?.image;
      const index = validImages.findIndex((candidate) => sameImage(candidate, image));
      if (index >= 0) setActive(index);
    };
    window.addEventListener("screwnet:variation-image", handleVariationImage);
    return () => window.removeEventListener("screwnet:variation-image", handleVariationImage);
  }, [productId, validImages]);

  const move = useCallback((delta) => {
    if (!validImages.length) return;
    setActive((prev) => (prev + delta + validImages.length) % validImages.length);
  }, [validImages.length]);

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [move]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      move(dx < 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!current?.src) {
    return (
      <div className="product-gallery product-gallery-empty">
        <div className="gallery-main empty-frame">
          <ImageIcon size={48} className="text-slate-300" />
          <p>Product Image Coming Soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div
        className={`gallery-main ${current.isDrawing ? "is-drawing-view" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isMobile ? "default" : "zoom-in" }}
        onClick={() => setZoomed(true)}
      >
        <img
          src={current.src}
          alt={current.alt || `${name} view ${active + 1}`}
          className="gallery-primary-img"
          draggable={false}
        />

        {current.isDrawing ? (
          <div className="drawing-badge-tag">
            <Compass size={13} />
            <span>Technical Line Drawing</span>
          </div>
        ) : null}

        {validImages.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow prev"
              onClick={(e) => {
                e.stopPropagation();
                move(-1);
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="gallery-arrow next"
              onClick={(e) => {
                e.stopPropagation();
                move(1);
              }}
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <button
          type="button"
          className="gallery-zoom"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed(true);
          }}
          title="Zoom full screen"
          aria-label="Zoom full screen"
        >
          <Maximize2 size={15} />
        </button>

        {validImages.length > 1 && (
          <span className="gallery-count">
            {active + 1} / {validImages.length}
          </span>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="gallery-thumbnails">
          {validImages.map((img, index) => (
            <button
              type="button"
              className={`thumb-btn ${index === active ? "active" : ""} ${img.isDrawing ? "thumb-drawing" : ""}`}
              onClick={() => setActive(index)}
              key={img.id || index}
              aria-label={`View product image ${index + 1}`}
            >
              <img src={img.src} alt={`${name} thumbnail ${index + 1}`} />
              {img.isDrawing ? (
                <span className="thumb-drawing-label">CAD</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div className="gallery-lightbox" onClick={() => setZoomed(false)}>
          <button type="button" className="lightbox-close" aria-label="Close modal" onClick={() => setZoomed(false)}>
            <X size={24} />
          </button>
          <div className="lightbox-image-container" onClick={(event) => event.stopPropagation()}>
            <img
              src={current.src}
              alt={current.alt || name}
            />
            {current.isDrawing ? (
              <span className="lightbox-caption">Dimension Line Drawing & Geometric Blueprint</span>
            ) : (
              <span className="lightbox-caption">{name}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
