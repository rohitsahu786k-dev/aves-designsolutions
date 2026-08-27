"use client";

import Link from "next/link";
import { ArrowRight, Heart, PackageCheck, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { readWishlist, removeWishlistItem } from "@/components/wishlist-button";
import { addToCart, openCartDrawer } from "@/lib/cart-store";
import { productUnitPrice } from "@/lib/coupon-utils";
import { decodeHtml } from "@/lib/utils";

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

function getRegularPrice(product) {
  const prices = product?.prices || {};
  const minor = Number(prices.currency_minor_unit ?? 2);
  const current = Number(prices.price || 0) / Math.pow(10, minor);
  const regular = Number(prices.regular_price || prices.price || 0) / Math.pow(10, minor);
  return regular > current ? regular : 0;
}

export function WishlistView() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const update = () => setItems(readWishlist());
    update();
    window.addEventListener("screwnet:wishlist", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("screwnet:wishlist", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  function remove(id) {
    removeWishlistItem(id);
    setItems(readWishlist());
  }

  function move(product) {
    if (product.has_options || !product.is_in_stock) return;
    addToCart(product, 1);
    removeWishlistItem(product.id);
    setItems(readWishlist());
    openCartDrawer();
  }

  return (
    <div className="wishlist-page professional-wishlist">
      <section className="wishlist-hero">
        <div className="container wishlist-hero-inner">
          <div>
            <span className="wishlist-kicker"><Heart size={14} fill="currentColor" /> Saved Fasteners</span>
            <h1>Your Saved Fasteners & Screws</h1>
            <p>Keep your required sizes and bolts in one place and move them to your cart when ready to order.</p>
          </div>
          <div className="wishlist-hero-meta">
            <strong>{items.length}</strong>
            <span>{items.length === 1 ? "saved item" : "saved items"}</span>
          </div>
        </div>
      </section>

      <div className="container wishlist-content">
        {items.length ? (
          <>
            <div className="wishlist-toolbar">
              <div>
                <strong>{items.length} {items.length === 1 ? "item" : "items"}</strong>
                <span>Prices and stock stay synced with live warehouse inventory.</span>
              </div>
              <Link href="/shop" className="wishlist-continue-link">Continue shopping <ArrowRight size={15} /></Link>
            </div>

            <div className="wishlist-grid">
              {items.map((product) => {
                const currentPrice = productUnitPrice(product);
                const regularPrice = getRegularPrice(product);
                const discount = regularPrice > currentPrice ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100) : 0;
                const image = product.images?.[0]?.src || product.images?.[0]?.thumbnail;
                const category = decodeHtml(product.categories?.[0]?.name || "screwnet Fasteners");
                const title = decodeHtml(product.name || "Product");

                return (
                  <article className="wishlist-card" key={product.id}>
                    <div className="wishlist-media-wrap">
                      <Link className="wishlist-image" href={`/product/${product.slug}`} aria-label={`View ${title}`}>
                        {image ? <img src={image} alt={title} loading="lazy" /> : <span className="wishlist-image-fallback">Image coming soon</span>}
                      </Link>
                      {discount > 0 ? <span className="wishlist-sale-badge">{discount}% OFF</span> : null}
                      <button type="button" className="wishlist-card-remove-icon" onClick={() => remove(product.id)} aria-label={`Remove ${title} from wishlist`}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="wishlist-copy">
                      <small>{category}</small>
                      <Link href={`/product/${product.slug}`}><h2>{title}</h2></Link>

                      <div className="wishlist-price-block">
                        <strong>{money(currentPrice)}</strong>
                        {regularPrice ? <span className="wishlist-old-price">{money(regularPrice)}</span> : null}
                        {discount ? <span className="wishlist-discount">{discount}% off</span> : null}
                      </div>

                      <div className={`wishlist-stock ${product.is_in_stock ? "in-stock" : "out-stock"}`}>
                        <PackageCheck size={14} />
                        <span>{product.is_in_stock ? "In stock & ready to ship" : "Currently out of stock"}</span>
                      </div>
                    </div>

                    <div className="wishlist-actions">
                      {product.has_options ? (
                        <Link className="wishlist-primary-action" href={`/product/${product.slug}`}>
                          <Sparkles size={15} /> Select options
                        </Link>
                      ) : (
                        <button type="button" className="wishlist-primary-action" disabled={!product.is_in_stock} onClick={() => move(product)}>
                          <ShoppingBag size={15} /> Move to cart
                        </button>
                      )}
                      <button type="button" className="wishlist-secondary-action" onClick={() => remove(product.id)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon"><Heart size={30} /></div>
            <span className="wishlist-kicker">Nothing saved yet</span>
            <h2>Your saved list is empty</h2>
            <p>Tap the heart on any screw, bolt or fastener to save it for quick re-ordering.</p>
            <Link className="wishlist-primary-action wishlist-empty-cta" href="/shop">Explore Fasteners <ArrowRight size={15} /></Link>
          </div>
        )}
      </div>
    </div>
  );
}
