"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, SlidersHorizontal, Star } from "lucide-react";
import { decodeHtml, formatAttributeLabel, formatPrice, getColorSwatch, isFinishAttribute } from "@/lib/utils";
import { WpImage } from "@/components/wp-image";
import { AddToCartDrawer } from "@/components/add-to-cart-drawer";
import { WishlistButton } from "@/components/wishlist-button";

function normalize(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function attributeKey(attribute) {
  const key = attribute.taxonomy || attribute.slug || attribute.name;
  return `attribute_${normalize(key).replace(/-/g, "_")}`;
}

export function ProductCard({ product }) {
  const [selected, setSelected] = useState({});
  const acf = product.acf_fields || {};
  const title = decodeHtml(product.name);
  const categoryName = decodeHtml(product.categories?.[0]?.name || "Fasteners");

  const variationAttributes = product.attributes?.filter((attribute) => attribute.has_variations) || [];

  const variation = useMemo(
    () =>
      product.variations?.find((candidate) =>
        candidate.attributes?.every((attribute) => normalize(selected[attribute.name] || selected[attribute.taxonomy]) === normalize(attribute.value || attribute.option))
      ),
    [product.variations, selected]
  );

  const activePrices = variation?.prices || product.prices;
  const cardAttributes = Object.fromEntries(
    variationAttributes.map((attribute) => [attributeKey(attribute), selected[attribute.name]])
  );

  const regular = activePrices?.regular_price !== activePrices?.price ? activePrices?.regular_price : null;
  const regularPrice = regular ? formatPrice({ ...activePrices, price: regular }) : null;
  const priceValue = Number(activePrices?.price || 0);
  const regularValue = Number(regular || 0);
  const discount = regularValue > priceValue ? Math.round(((regularValue - priceValue) / regularValue) * 100) : 0;

  const image = variation?.image?.src ? variation.image : product.images?.[0];
  const secondImage = product.images?.[1] || null;

  const activeProduct = variation
    ? {
        ...product,
        prices: variation.prices || product.prices,
        images: variation.image?.src ? [variation.image, ...(product.images || []).filter((candidate) => candidate.id !== variation.image.id)] : product.images,
        is_in_stock: variation.is_in_stock !== false,
      }
    : product;

  const isVariable = product.has_options || (product.variations && product.variations.length > 0);
  const hasRating = Number(product.average_rating) > 0;

  return (
    <article className="product-card">
      <div className="product-media-wrapper">
        <Link prefetch={false} className="product-media" href={`/product/${product.slug}`}>
          <WpImage className="product-image-primary" src={image?.src || image?.thumbnail} alt={image?.alt || title} />
          {secondImage?.src && secondImage.src !== image?.src ? (
            <WpImage className="product-image-secondary" src={secondImage.src} alt={secondImage.alt || `${title} view`} />
          ) : null}

          {/* Badges */}
          <div className="card-badge-strip">
            {acf.productBadge ? (
              <span className="card-custom-badge">{acf.productBadge}</span>
            ) : product.on_sale && discount ? (
              <span className="card-sale-badge">{discount}% OFF</span>
            ) : null}
          </div>

          <span className="quick-view">VIEW SPECIFICATIONS</span>
        </Link>
        <WishlistButton product={product} />
      </div>

      <div className="product-info">
        <div className="product-brand-row">
          <span className="product-brand">{categoryName}</span>
          {hasRating ? (
            <div className="product-card-rating">
              <Star size={11} className="star-icon fill-black text-black" />
              <span>{Number(product.average_rating).toFixed(1)}</span>
              <small>({product.review_count})</small>
            </div>
          ) : null}
        </div>

        <Link prefetch={false} href={`/product/${product.slug}`} className="product-title-link">
          <h3 title={title}>{title}</h3>
        </Link>

        {/* Price Row */}
        <div className="price-row">
          <div className="price-group">
            <span className="price">{formatPrice(activePrices)}</span>
            {regularPrice ? <span className="old-price">{regularPrice}</span> : null}
          </div>
          {discount ? <span className="discount-text">{discount}% off</span> : null}
        </div>

        {/* Fast Variant Swatches Preview */}
        {variationAttributes.slice(0, 2).map((attribute) => {
          const isFinish = isFinishAttribute(attribute.taxonomy || attribute.name);
          const terms = attribute.terms?.filter((term) => term?.name) || [];
          if (!terms.length) return null;

          const label = formatAttributeLabel(attribute.name);

          return (
            <div className="card-variant-mini-row" key={attribute.name}>
              <span className="mini-variant-label">{label}:</span>
              <div className="mini-swatch-list">
                {terms.slice(0, 5).map((term) => {
                  const isSelected = selected[attribute.name] === term.slug || selected[attribute.name] === term.name;
                  const swatch = isFinish ? getColorSwatch(term.slug || term.name) : null;

                  if (isFinish && swatch) {
                    return (
                      <button
                        type="button"
                        className={`mini-circle-swatch ${isSelected ? "selected" : ""}`}
                        style={{ background: swatch.background, borderColor: swatch.border }}
                        title={decodeHtml(term.name)}
                        aria-label={decodeHtml(term.name)}
                        onClick={() => setSelected((c) => ({ ...c, [attribute.name]: term.slug || term.name }))}
                        key={term.slug || term.name}
                      />
                    );
                  }

                  return (
                    <button
                      type="button"
                      className={`mini-size-pill ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelected((c) => ({ ...c, [attribute.name]: term.slug }))}
                      key={term.slug || term.name}
                    >
                      {decodeHtml(term.name)}
                    </button>
                  );
                })}
                {terms.length > 5 ? <span className="more-terms-count">+{terms.length - 5}</span> : null}
              </div>
            </div>
          );
        })}

        {/* Stock Status Indicator */}
        <div className="product-stock-line">
          <span className={(variation ? variation.is_in_stock : product.is_in_stock) ? "stock-in" : "stock-out"}>
            <span className="stock-dot" />
            {(variation ? variation.is_in_stock : product.is_in_stock) ? "In Stock • Live Sync" : "Out of Stock"}
          </span>
          {acf.moq && acf.moq > 1 ? (
            <span className="card-moq-label">MOQ: {acf.moq}</span>
          ) : null}
        </div>

        {/* Action Button: Choose Options for variable vs Add to Cart for simple */}
        {isVariable ? (
          <Link prefetch={false} href={`/product/${product.slug}`} className="button button-outline card-choose-options-btn">
            <SlidersHorizontal size={14} />
            <span>Choose Options</span>
          </Link>
        ) : (
          <AddToCartDrawer
            product={activeProduct}
            compact
            cartMeta={{ variationId: variation?.id, attributes: cardAttributes, cartProduct: activeProduct }}
            disabled={product.is_in_stock === false}
          />
        )}
      </div>
    </article>
  );
}
