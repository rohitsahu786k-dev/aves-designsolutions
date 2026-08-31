"use client";

import { Search } from "lucide-react";

export function HeaderSearchTrigger() {
  return (
    <button
      type="button"
      className="icon-button pro-search-trigger"
      aria-label="Open search"
      onClick={() => window.dispatchEvent(new Event("screwnet:search-open"))}
    >
      <Search size={22} />
    </button>
  );
}
