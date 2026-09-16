"use client";

import { CreditCard, Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addCartItem, buyNow, openCartDrawer } from "@/lib/cart-store";

export function AddToCartDrawer({ product, compact = false, quantity: suppliedQuantity, disabled = false, cartMeta = {} }) {
  const router = useRouter();
  const [localQuantity, setLocalQuantity] = useState(1);
  const quantity = suppliedQuantity ?? localQuantity;
  const unavailable = disabled || !product.is_in_stock;
  const needsOptions = product.has_options && !cartMeta.variationId;
  const buttonLabel = !product.is_in_stock ? "Out of stock" : needsOptions ? "Select option" : "Add to bag";

  const variation = { id: cartMeta.variationId || 0, attributes: cartMeta.attributes || {} };

  function buyOne() {
    if (unavailable || needsOptions) return;
    buyNow(cartMeta.cartProduct || product, quantity, variation);
    router.push("/checkout");
  }

  function addAndOpen() {
    if (unavailable || needsOptions) return;
    addCartItem(cartMeta.cartProduct || product, quantity, variation);
    openCartDrawer();
  }

  const actionButton = (
    <button
      type="button"
      className={compact ? "card-quick-add" : "button add-cart-button"}
      onClick={addAndOpen}
      disabled={unavailable || needsOptions}
      aria-label={`${buttonLabel}: ${product.name}`}
    >
      <ShoppingBag size={compact ? 15 : 18} />
      <span>{buttonLabel}</span>
    </button>
  );

  if (!compact) {
    return (
      <button
        type="button"
        className="button add-cart-button"
        onClick={addAndOpen}
        disabled={unavailable || needsOptions}
        aria-label={`${buttonLabel}: ${product.name}`}
      >
        <ShoppingBag size={18} />
        <span>{buttonLabel}</span>
      </button>
    );
  }

  return (
    <div className="card-purchase-block">
      <div className="card-purchase-row">
        <div className="card-quantity" aria-label="Quantity selector">
          <button type="button" onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} aria-label="Decrease quantity">
            <Minus size={13} />
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setLocalQuantity(localQuantity + 1)} aria-label="Increase quantity">
            <Plus size={13} />
          </button>
        </div>
        {actionButton}
      </div>
      <button type="button" className="card-buy-now" onClick={buyOne} disabled={unavailable || needsOptions}>
        <CreditCard size={14} /> <span>Buy now</span>
      </button>
    </div>
  );
}
