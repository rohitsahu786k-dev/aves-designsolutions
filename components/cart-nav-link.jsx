"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { openCartDrawer, readCart } from "@/lib/cart-store";

export function CartNavLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(readCart().reduce((sum, item) => sum + Number(item.quantity || 1), 0));
    update();
    window.addEventListener("screwnet:cart", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("screwnet:cart", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return (
    <button
      type="button"
      className="icon-button cart-nav-button"
      onClick={openCartDrawer}
      aria-label={`Open cart with ${count} items`}
    >
      <ShoppingBag size={20} />
      {count ? <span>{count}</span> : null}
    </button>
  );
}
