"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Grid2X2 } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

export function HeaderCategoryDropdown({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const visibleCategories = categories.filter((category) => category.count > 0).slice(0, 28);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="pro-category-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="pro-category-select"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span>All Categories</span>
        <ChevronDown size={14} />
      </button>

      {open ? (
        <div className="pro-category-menu" role="menu">
          <Link href="/shop" role="menuitem" onClick={() => setOpen(false)} className="featured">
            <Grid2X2 size={15} />
            <span>All Fasteners</span>
          </Link>
          {visibleCategories.map((category) => (
            <Link href={`/category/${category.slug}`} role="menuitem" onClick={() => setOpen(false)} key={category.id}>
              <span>{decodeHtml(category.name)}</span>
              <small>{category.count}</small>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
