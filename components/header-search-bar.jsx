"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Package, Search, Sparkles, Tag, X } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

export function HeaderSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FiboSearch query debouncing
  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.suggestions || []);
          setIsOpen(true);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("FiboSearch client error:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  const handleQueryChange = (e) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
    }
  };

  const clearQuery = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="desktop-search-container" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="desktop-search-form" role="search">
        <Search size={17} className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search DIN 912, SS304, M3x10, socket cap, bolts, nuts..."
          autoComplete="off"
          aria-label="FiboSearch Fastener Catalog"
          aria-autocomplete="list"
        />
        {loading && <Loader2 size={15} className="search-loading-spinner animate-spin" />}
        {!loading && query && (
          <button type="button" onClick={clearQuery} className="search-clear-btn" aria-label="Clear search">
            <X size={14} />
          </button>
        )}
        <button type="submit" className="search-submit-btn" aria-label="Search">
          <Search size={18} />
        </button>
      </form>

      {/* FiboSearch Dropdown Results */}
      {isOpen && (
        <div className="fibosearch-dropdown-modal" role="listbox">
          <div className="fibosearch-dropdown-header">
            <span>FiboSearch Live Results</span>
            <span className="fibosearch-count-badge">{results.length} found</span>
          </div>

          {results.length > 0 ? (
            <div className="fibosearch-results-list">
              {results.map((item) => (
                <Link
                  href={item.href}
                  key={`${item.type}-${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className="fibosearch-result-row"
                >
                  <div className="fibosearch-thumb-box">
                    {item.image ? (
                      <img src={item.image} alt={item.label} className="fibosearch-thumb-img" />
                    ) : (
                      <Package size={18} className="fibosearch-thumb-fallback" />
                    )}
                  </div>

                  <div className="fibosearch-info-col">
                    <span className="fibosearch-title">{decodeHtml(item.label)}</span>
                    <div className="fibosearch-meta-line">
                      {item.type === "product" && item.sku && (
                        <span className="fibosearch-sku-tag">SKU: {item.sku}</span>
                      )}
                      {item.type === "category" && (
                        <span className="fibosearch-cat-tag">Category</span>
                      )}
                      {item.price && (
                        <strong className="fibosearch-price">₹{parseFloat(item.price).toFixed(2)}</strong>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={14} className="fibosearch-arrow" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="fibosearch-empty-state">
              <p>No exact fastener matches found for &quot;{query}&quot;.</p>
              <small>Press Enter to search entire warehouse inventory.</small>
            </div>
          )}

          <div className="fibosearch-dropdown-footer">
            <Link
              href={`/shop?search=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsOpen(false)}
              className="fibosearch-all-link"
            >
              <span>See all results for &quot;{query}&quot;</span>
              <ChevronRight size={13} />
            </Link>
            <span className="fibosearch-engine-brand">Powered by FiboSearch Engine</span>
          </div>
        </div>
      )}
    </div>
  );
}
