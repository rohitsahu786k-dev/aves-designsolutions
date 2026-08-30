"use client";

import { Check, Clock, FileText, Info, MessageSquare, Minus, PackageCheck, Plus, ShieldCheck, Tag, Truck, Wrench, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AddToCartDrawer } from "@/components/add-to-cart-drawer";
import { WishlistButton } from "@/components/wishlist-button";
import { CouponOffers } from "@/components/coupon-offers";
import { ProductHighlights } from "@/components/pdp/product-highlights";
import { BulkEnquiryModal } from "@/components/pdp/bulk-enquiry-modal";
import { createHandoffUrl } from "@/lib/cart-store";
import { decodeHtml, formatAttributeLabel, formatPrice, getColorSwatch, isFinishAttribute } from "@/lib/utils";

function normalize(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const DEFAULT_PRICES = { price: "0", currency_code: "INR", currency_minor_unit: 2 };

function attributeKey(attribute) {
  const key = attribute.taxonomy || attribute.slug || attribute.name;
  return `attribute_${normalize(key).replace(/-/g, "_")}`;
}

function variationMatchesSelection(candidate, selected) {
  return (candidate.attributes || []).every((attribute) => {
    const selectedValue = selected[attribute.name] || selected[attribute.taxonomy];
    return normalize(selectedValue) === normalize(attribute.value || attribute.option);
  });
}

function alignedQuantity(value, moq, step) {
  const validBase = Math.max(moq, value);
  const rem = (validBase - moq) % step;
  return rem === 0 ? validBase : validBase + (step - rem);
}

export function ProductPurchasePanel({ product }) {
  const acf = product.acf_fields || {};
  const moq = acf.moq || 1;
  const step = acf.quantityStep || 1;

  const [quantity, setQuantity] = useState(() => alignedQuantity(moq, moq, step));
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const variationAttributes = product.attributes?.filter((attribute) => attribute.has_variations) || [];

  // Automatically initialize with the first option of each variation attribute
  const [selected, setSelected] = useState(() => {
    const initial = {};
    variationAttributes.forEach((attr) => {
      const first = attr.terms?.find((t) => t?.name || t?.slug);
      if (first) {
        initial[attr.name] = first.slug || first.name;
      }
    });
    return initial;
  });

  const ready = !product.has_options || variationAttributes.every((attribute) => selected[attribute.name]);

  const variation = useMemo(
    () =>
      product.variations?.find((candidate) => variationMatchesSelection(candidate, selected)),
    [product.variations, selected]
  );
  const selectedInStock = !product.has_options || variation?.is_in_stock !== false;

  // Dynamic Price Calculation
  const basePrices = product.prices || DEFAULT_PRICES;
  const minor = basePrices.currency_minor_unit ?? 2;

  const variationPriceRaw = variation?.prices?.price || (variation?.price ? String(Math.round(Number(variation.price) * Math.pow(10, minor))) : null);
  const activePriceObj = useMemo(
    () => (variationPriceRaw ? { ...basePrices, price: variationPriceRaw } : basePrices),
    [basePrices, variationPriceRaw]
  );

  const variationRegularRaw = variation?.prices?.regular_price || (variation?.regular_price ? String(Math.round(Number(variation.regular_price) * Math.pow(10, minor))) : null);
  const regularPriceObj = variationRegularRaw ? { ...basePrices, price: variationRegularRaw } : (basePrices.regular_price !== basePrices.price ? { ...basePrices, price: basePrices.regular_price } : null);

  const unitValue = Number(activePriceObj.price || 0) / Math.pow(10, minor);
  const regularValue = regularPriceObj ? Number(regularPriceObj.price || 0) / Math.pow(10, minor) : unitValue;
  const discountPercent = regularValue > unitValue ? Math.round(((regularValue - unitValue) / regularValue) * 100) : 0;

  const totalValue = unitValue * quantity;
  const totalFormattedPrice = formatPrice({ ...activePriceObj, price: String(Math.round(totalValue * Math.pow(10, minor))) });
  const activeFormattedPrice = formatPrice(activePriceObj);
  const regularFormattedPrice = regularPriceObj ? formatPrice(regularPriceObj) : null;
  const activeProduct = useMemo(() => {
    if (!variation) return product;
    return {
      ...product,
      prices: activePriceObj,
      images: variation.image?.src ? [variation.image, ...(product.images || []).filter((image) => image.id !== variation.image.id)] : product.images,
      is_in_stock: selectedInStock,
      sku: variation.sku || product.sku,
    };
  }, [product, variation, activePriceObj, selectedInStock]);

  useEffect(() => {
    if (!variation?.image?.src) return;
    window.dispatchEvent(new CustomEvent("screwnet:variation-image", { detail: { productId: product.id, image: variation.image } }));
  }, [product.id, variation?.id, variation?.image]);

  const root = product.permalink ? new URL(product.permalink).origin : "";
  const params = new URLSearchParams({ "add-to-cart": String(product.id), quantity: String(quantity) });

  if (variation?.id) {
    params.set("variation_id", String(variation.id));
    variationAttributes.forEach((attribute) => params.set(attributeKey(attribute), selected[attribute.name]));
  }

  const addUrl = `${root}/?${params}`;
  const buyUrl = `${root}/checkout/?${params}`;
  const cartAttributes = Object.fromEntries(
    variationAttributes.map((attribute) => [attributeKey(attribute), selected[attribute.name]])
  );

  function handleQuantityDecrement() {
    setQuantity((q) => Math.max(moq, q - step));
  }

  function handleQuantityIncrement() {
    setQuantity((q) => q + step);
  }

  function toggleSelected(attributeName, value) {
    setSelected((current) => ({
      ...current,
      [attributeName]: current[attributeName] === value ? "" : value,
    }));
  }

  function handleBulkEnquiryClick() {
    if (acf.bulkEnquiryUrl) {
      window.open(acf.bulkEnquiryUrl, "_blank", "noreferrer");
    } else {
      setBulkModalOpen(true);
    }
  }

  return (
    <div className="pdp-purchase-panel" id="product-purchase-box">
      {/* 1. Header & Badges */}
      <div className="pdp-panel-header-badges">
        {acf.productBadge ? (
          <span className="pdp-merchandising-badge">{acf.productBadge}</span>
        ) : null}
        {discountPercent > 0 ? (
          <span className="pdp-discount-badge">{discountPercent}% OFF</span>
        ) : null}
      </div>

      {/* 2. Subtitle */}
      {acf.productSubtitle ? (
        <p className="pdp-product-subtitle">{acf.productSubtitle}</p>
      ) : null}

      {/* 3. SKU, MPN & Origin Meta Row */}
      <div className="pdp-sku-mpn-row">
        {(variation?.sku || product.sku) ? (
          <span className="pdp-code-tag">
            SKU: <strong>{variation?.sku || product.sku}</strong>
          </span>
        ) : null}
        {acf.mpn ? (
          <span className="pdp-code-tag">
            MPN: <strong>{acf.mpn}</strong>
          </span>
        ) : null}
        {acf.hsnCode ? (
          <span className="pdp-code-tag">
            HSN: <strong>{acf.hsnCode}</strong>
          </span>
        ) : null}
      </div>

      {/* 4. Live Dynamic Price & Subtotal */}
      <div className="pdp-dynamic-price-box">
        <div className="pdp-price-header-row">
          <div className="pdp-price-group">
            <span className="pdp-live-price">{activeFormattedPrice}</span>
            {regularFormattedPrice && regularFormattedPrice !== activeFormattedPrice ? (
              <span className="pdp-live-old-price">{regularFormattedPrice}</span>
            ) : null}
            <span className="pdp-unit-tax-note">/ unit (Incl. GST)</span>
          </div>

          {quantity > 1 ? (
            <div className="pdp-live-total-pill">
              <span>Subtotal: <strong>{totalFormattedPrice}</strong></span>
              <small>({quantity} pcs)</small>
            </div>
          ) : null}
        </div>

        {/* Dispatch & Stock Status */}
        <div className="pdp-stock-lead-row">
          <span className={selectedInStock ? "stock-pill stock-in" : "stock-pill stock-out"}>
            <PackageCheck size={14} />
            {selectedInStock ? "In Stock • Live Inventory" : "Currently Out of Stock"}
          </span>
          {acf.dispatchLeadTime ? (
            <span className="lead-time-pill">
              <Clock size={13} /> {acf.dispatchLeadTime}
            </span>
          ) : (
            <span className="lead-time-pill">
              <Truck size={13} /> Dispatches in 24-48 hours
            </span>
          )}
        </div>
      </div>

      {/* 5. Variant Selectors (Shopify-Style Fastener UX) */}
      <div className="pdp-variants-container">
        {product.attributes?.map((attribute) => {
          const isFinish = isFinishAttribute(attribute.taxonomy || attribute.name);
          const terms = attribute.terms?.filter((term) => term?.name) || [];
          if (!terms.length) return null;

          const label = formatAttributeLabel(attribute.name);
          const currentSlug = selected[attribute.name];
          const currentTerm = terms.find((t) => t.slug === currentSlug || t.name === currentSlug) || terms[0];
          const currentDisplayName = decodeHtml(currentTerm?.name || currentSlug || "");

          return (
            <div className="fastener-variant-group" key={attribute.name}>
              <div className="variant-header-row">
                <span className="variant-label-title">{label}:</span>
                <strong className="variant-selected-name">{currentDisplayName}</strong>
              </div>

              <div className="variant-options-track">
                {terms.map((term) => {
                  const isSelected = selected[attribute.name] === term.slug || selected[attribute.name] === term.name;
                  const swatch = isFinish ? getColorSwatch(term.slug || term.name) : null;

                  if (isFinish && swatch) {
                    return (
                      <button
                        type="button"
                        className={`fastener-finish-pill ${isSelected ? "is-selected" : ""}`}
                        onClick={() => toggleSelected(attribute.name, term.slug || term.name)}
                        key={`${attribute.name}-${term.slug || term.name}`}
                        title={decodeHtml(term.name)}
                      >
                        <span
                          className="finish-swatch-circle"
                          style={{
                            background: swatch.background,
                            borderColor: swatch.border,
                          }}
                        >
                          {isSelected ? <Check size={11} color={swatch.textColor} strokeWidth={3} /> : null}
                        </span>
                        <span className="finish-name-text">{decodeHtml(term.name)}</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      className={`fastener-size-pill ${isSelected ? "is-active" : ""}`}
                      onClick={() => toggleSelected(attribute.name, term.slug || term.name)}
                      key={`${attribute.name}-${term.slug || term.name}`}
                    >
                      {decodeHtml(term.name)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. MOQ & Step Note if > 1 */}
      {(moq > 1 || step > 1) ? (
        <div className="moq-guidance-pill">
          <Info size={14} />
          <span>
            Minimum Order: <strong>{moq} pcs</strong> (Pack increments of <strong>{step} pcs</strong>)
          </span>
        </div>
      ) : null}

      {/* 7. Quantity & Add to Cart Actions */}
      <div className="pdp-purchase-actions-stack">
        <div className="pdp-qty-add-row">
          <div className="fastener-qty-stepper">
            <button
              type="button"
              onClick={handleQuantityDecrement}
              aria-label="Decrease quantity"
              disabled={quantity <= moq}
              title={quantity <= moq ? `Minimum order is ${moq}` : "Decrease"}
            >
              <Minus size={15} />
            </button>
            <span className="stepper-val">{quantity}</span>
            <button
              type="button"
              onClick={handleQuantityIncrement}
              aria-label="Increase quantity"
            >
              <Plus size={15} />
            </button>
          </div>

          <AddToCartDrawer
            product={product}
            addToCartUrl={addUrl}
            buyNowUrl={buyUrl}
            quantity={quantity}
            cartMeta={{ variationId: variation?.id, attributes: cartAttributes, cartProduct: activeProduct }}
            disabled={!ready || (product.has_options && !variation) || !selectedInStock}
          />

          <WishlistButton product={product} className="icon-button pdp-wishlist-btn" />
        </div>

        {/* Buy Now Button */}
        <div className="pdp-buy-now-row">
          <button
            type="button"
            className="button pdp-buy-now-btn"
            onClick={() => {
              if (!ready || (product.has_options && !variation) || !selectedInStock) return;
              const item = { product: activeProduct, quantity, variationId: variation?.id || 0, variationAttributes: cartAttributes };
              window.location.href = createHandoffUrl([item], "", "checkout");
            }}
            disabled={!ready || (product.has_options && !variation) || !selectedInStock}
          >
            <Zap size={18} />
            <span>Buy Now</span>
          </button>
        </div>

        {/* 8. Bulk Commercial Enquiry CTA */}
        {acf.bulkEnquiryEnabled ? (
          <button
            type="button"
            className="button button-outline pdp-bulk-rfq-btn"
            onClick={handleBulkEnquiryClick}
          >
            <FileText size={16} />
            <span>{acf.bulkEnquiryLabel || "Request Bulk Contractor Quote"}</span>
          </button>
        ) : null}
      </div>

      {/* 9. Purchase Box Highlights */}
      <ProductHighlights highlights={acf.pdpHighlights} />

      {/* 10. Bulk Pricing & Shipping Notes */}
      {acf.bulkPricingNote ? (
        <div className="pdp-commerce-note-box">
          <strong>Wholesale Tiered Pricing:</strong>
          <p>{acf.bulkPricingNote}</p>
        </div>
      ) : null}

      {acf.productShippingNote ? (
        <div className="pdp-commerce-note-box shipping">
          <strong>Shipping Note:</strong>
          <p>{acf.productShippingNote}</p>
        </div>
      ) : null}

      {/* 11. Active Coupons */}
      <CouponOffers items={[{ product, quantity }]} compact />

      {/* Bulk Enquiry Modal */}
      <BulkEnquiryModal
        product={product}
        acf={acf}
        currentVariant={variation}
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />
    </div>
  );
}
