"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Grid2X2, Grid3X3, LayoutGrid, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { decodeHtml, formatAttributeLabel, getColorSwatch, isFinishAttribute } from "@/lib/utils";

function withQuery(basePath, current, updates) {
  const next = new URLSearchParams();
  Object.entries({ ...current, ...updates }).forEach(([key, value]) => {
    if (Array.isArray(value)) value = value[0];
    if (value !== undefined && value !== null && value !== "") next.set(key, String(value));
  });
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function queryValue(query, key) {
  const value = query?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export function CollectionBrowser({ products = [], pagination, categories = [], attributes = [], basePath = "/shop", activeQuery = {} }) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columns, setColumns] = useState(3);

  const visibleCategories = categories.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  const reserved = new Set(["search", "orderby", "order", "page", "per_page"]);
  const activeEntries = Object.entries(activeQuery).filter(([key]) => !reserved.has(key) && queryValue(activeQuery, key));
  const activeCount = activeEntries.length;

  const totalProducts = pagination?.total ?? products.length;
  const currentPage = Number(pagination?.page || queryValue(activeQuery, "page") || 1);
  const totalPages = Number(pagination?.totalPages || Math.ceil(totalProducts / (pagination?.perPage || 50)) || 1);
  const perPage = Number(pagination?.perPage || 50);

  const startIndex = totalProducts > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const endIndex = Math.min(totalProducts, currentPage * perPage);

  const currentSort = queryValue(activeQuery, "orderby")
    ? `${queryValue(activeQuery, "orderby")}:${queryValue(activeQuery, "order") || "asc"}`
    : "menu_order:asc";

  function handleSortChange(e) {
    const val = e.target.value;
    const [orderby, order] = val.split(":");
    const url = withQuery(basePath, activeQuery, { orderby, order, page: 1 });
    router.push(url);
  }

  function toggleHref(key, value) {
    return withQuery(basePath, activeQuery, { [key]: queryValue(activeQuery, key) === value ? null : value, page: 1 });
  }

  function priceHref(min, max) {
    const selected = queryValue(activeQuery, "min_price") === min && queryValue(activeQuery, "max_price") === max;
    return withQuery(basePath, activeQuery, { min_price: selected ? null : min, max_price: selected ? null : max, page: 1 });
  }

  // Generate pagination pages list
  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  const pageNumbers = getPageNumbers();

  const filterContent = (
    <div className="filter-panel-inner">
      <div className="filter-title">
        <span>Filter Fasteners {activeCount ? `(${activeCount})` : ""}</span>
        <button type="button" className="close-filter-btn" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
          <X size={18} />
        </button>
      </div>

      {activeCount ? (
        <Link
          className="clear-filters-link"
          href={withQuery(basePath, activeQuery, Object.fromEntries(activeEntries.map(([k]) => [k, null])))}
          onClick={() => setFiltersOpen(false)}
        >
          <RotateCcw size={13} /> Clear all filters ({activeCount})
        </Link>
      ) : null}

      {/* Category Filter */}
      {visibleCategories.length > 0 ? (
        <details className="filter-accordion-group" open>
          <summary>
            <span>Category</span>
            <ChevronDown size={14} className="filter-chevron" />
          </summary>
          <div className="filter-options-list">
            {visibleCategories.slice(0, 30).map((category) => (
              <Link href={`/category/${category.slug}`} key={category.id} onClick={() => setFiltersOpen(false)} className="filter-option-row">
                <span className="filter-custom-check" />
                <span className="option-name">{decodeHtml(category.name)}</span>
                <small className="option-count">{category.count}</small>
              </Link>
            ))}
          </div>
        </details>
      ) : null}

      {/* Stock & Offer Status */}
      <details className="filter-accordion-group" open>
        <summary>
          <span>Availability & Deals</span>
          <ChevronDown size={14} className="filter-chevron" />
        </summary>
        <div className="filter-options-list">
          <Link href={toggleHref("stock_status", "instock")} className="filter-option-row">
            <span className="filter-custom-check">{queryValue(activeQuery, "stock_status") === "instock" ? <Check size={11} /> : null}</span>
            <span className="option-name">In Stock Only</span>
          </Link>
          <Link href={toggleHref("on_sale", "true")} className="filter-option-row">
            <span className="filter-custom-check">{queryValue(activeQuery, "on_sale") === "true" ? <Check size={11} /> : null}</span>
            <span className="option-name">Special Offers & Deals</span>
          </Link>
        </div>
      </details>

      {/* Price Range */}
      <details className="filter-accordion-group" open>
        <summary>
          <span>Price Range</span>
          <ChevronDown size={14} className="filter-chevron" />
        </summary>
        <div className="filter-options-list">
          <Link href={priceHref(null, "50000")} className="filter-option-row">
            <span className="filter-custom-check">{!queryValue(activeQuery, "min_price") && queryValue(activeQuery, "max_price") === "50000" ? <Check size={11} /> : null}</span>
            <span className="option-name">Under ₹500</span>
          </Link>
          <Link href={priceHref("50000", "100000")} className="filter-option-row">
            <span className="filter-custom-check">{queryValue(activeQuery, "min_price") === "50000" && queryValue(activeQuery, "max_price") === "100000" ? <Check size={11} /> : null}</span>
            <span className="option-name">₹500 - ₹1,000</span>
          </Link>
          <Link href={priceHref("100000", "250000")} className="filter-option-row">
            <span className="filter-custom-check">{queryValue(activeQuery, "min_price") === "100000" && queryValue(activeQuery, "max_price") === "250000" ? <Check size={11} /> : null}</span>
            <span className="option-name">₹1,000 - ₹2,500</span>
          </Link>
          <Link href={priceHref("250000", null)} className="filter-option-row">
            <span className="filter-custom-check">{queryValue(activeQuery, "min_price") === "250000" && !queryValue(activeQuery, "max_price") ? <Check size={11} /> : null}</span>
            <span className="option-name">Above ₹2,500</span>
          </Link>
        </div>
      </details>

      {/* Dynamic WooCommerce Global Fastener Attributes */}
      {attributes.map((attribute) => {
        const isFinish = isFinishAttribute(attribute.taxonomy || attribute.name);
        const label = formatAttributeLabel(attribute.name);
        const terms = attribute.terms?.filter((term) => term.count > 0) || [];
        if (!terms.length) return null;

        return (
          <details className="filter-accordion-group" open key={attribute.id}>
            <summary>
              <span>{label}</span>
              <ChevronDown size={14} className="filter-chevron" />
            </summary>
            <div className="filter-options-list">
              {terms.slice(0, 30).map((term) => {
                const key = attribute.taxonomy.replace("pa_", "");
                const selected = queryValue(activeQuery, key) === term.slug;
                const swatch = isFinish ? getColorSwatch(term.slug || term.name) : null;

                return (
                  <Link href={toggleHref(key, term.slug)} key={term.id} className="filter-option-row">
                    {isFinish && swatch ? (
                      <span
                        className={`filter-swatch-circle ${selected ? "selected" : ""}`}
                        style={{ background: swatch.background, borderColor: swatch.border }}
                      >
                        {selected ? <Check size={10} color={swatch.textColor} strokeWidth={3} /> : null}
                      </span>
                    ) : (
                      <span className="filter-custom-check">{selected ? <Check size={11} /> : null}</span>
                    )}
                    <span className="option-name">{decodeHtml(term.name)}</span>
                    <small className="option-count">{term.count}</small>
                  </Link>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Active Filter Chips Bar */}
      {activeCount > 0 ? (
        <div className="active-filters-bar" aria-label="Active filter tags">
          <span className="active-filter-label">Active Filters:</span>
          {activeEntries.map(([key]) => {
            const displayLabel = formatAttributeLabel(key);
            const displayValue = queryValue(activeQuery, key);
            return (
              <Link
                key={key}
                href={withQuery(basePath, activeQuery, { [key]: null, page: 1 })}
                className="active-filter-tag"
                title={`Remove ${displayLabel} filter`}
              >
                <span>{displayLabel}: <strong>{String(displayValue).replace(/-/g, " ")}</strong></span>
                <X size={13} />
              </Link>
            );
          })}
          <Link
            href={withQuery(basePath, activeQuery, Object.fromEntries(activeEntries.map(([k]) => [k, null])))}
            className="clear-all-tag"
          >
            Clear All
          </Link>
        </div>
      ) : null}

      {/* Toolbar: Mobile Filters Toggle, Sort Menu, Count, Grid Switcher */}
      <div className="collection-toolbar">
        <div className="toolbar-left">
          <button type="button" className="mobile-filter-trigger" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={16} />
            <span>Filters {activeCount ? `(${activeCount})` : ""}</span>
          </button>

          <div className="sort-select-wrapper">
            <label htmlFor="collection-sort-select" className="sr-only">Sort by</label>
            <select
              id="collection-sort-select"
              className="collection-sort-dropdown"
              value={currentSort}
              onChange={handleSortChange}
            >
              <option value="menu_order:asc">Sort: Featured</option>
              <option value="date:desc">Sort: Newest Arrivals</option>
              <option value="popularity:desc">Sort: Best Selling</option>
              <option value="price:asc">Sort: Price (Low to High)</option>
              <option value="price:desc">Sort: Price (High to Low)</option>
              <option value="rating:desc">Sort: Highest Rated</option>
            </select>
          </div>
        </div>

        <span className="toolbar-count">
          {totalProducts > 0 ? (
            <>
              Showing <strong>{startIndex}–{endIndex}</strong> of <strong>{totalProducts}</strong> Products (Page {currentPage} of {totalPages})
            </>
          ) : (
            `${products.length} Products`
          )}
        </span>

        <div className="grid-switcher" aria-label="Grid density switch">
          <button className={columns === 2 ? "active" : ""} onClick={() => setColumns(2)} aria-label="Two columns" title="2 Columns">
            <Grid2X2 size={16} />
          </button>
          <button className={columns === 3 ? "active" : ""} onClick={() => setColumns(3)} aria-label="Three columns" title="3 Columns">
            <LayoutGrid size={16} />
          </button>
          <button className={columns === 4 ? "active" : ""} onClick={() => setColumns(4)} aria-label="Four columns" title="4 Columns">
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>

      {/* Main Catalog Layout: Desktop Rail + Product Grid */}
      <div className="archive-layout industrial-archive">
        <aside className="desktop-filter-rail">{filterContent}</aside>

        <div className="collection-main-content">
          <div className={`product-grid collection-grid columns-${columns}`}>
            {products.length ? (
              products.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="collection-empty">
                <h3>No Fasteners Found</h3>
                <p>No fasteners match your selected attributes or search query. Try adjusting or clearing your filters.</p>
                <Link href={basePath} className="button mt-4">Reset All Filters</Link>
              </div>
            )}
          </div>

          {/* Numbered Pagination */}
          {totalPages > 1 ? (
            <nav className="catalog-pagination" aria-label="Fastener Catalog Pagination">
              <div className="pagination-wrapper">
                {currentPage > 1 ? (
                  <Link
                    href={withQuery(basePath, activeQuery, { page: currentPage - 1 })}
                    className="pagination-btn pagination-prev"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} /> Previous
                  </Link>
                ) : (
                  <button type="button" className="pagination-btn pagination-prev disabled" disabled>
                    <ChevronLeft size={16} /> Previous
                  </button>
                )}

                <div className="pagination-numbers">
                  {pageNumbers.map((p, idx) => {
                    if (p === "...") {
                      return <span key={`dots-${idx}`} className="pagination-ellipsis">...</span>;
                    }
                    const isCurrent = p === currentPage;
                    return (
                      <Link
                        key={`page-${p}`}
                        href={withQuery(basePath, activeQuery, { page: p })}
                        className={`pagination-number-btn ${isCurrent ? "active" : ""}`}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {currentPage < totalPages ? (
                  <Link
                    href={withQuery(basePath, activeQuery, { page: currentPage + 1 })}
                    className="pagination-btn pagination-next"
                    aria-label="Next Page"
                  >
                    Next <ChevronRight size={16} />
                  </Link>
                ) : (
                  <button type="button" className="pagination-btn pagination-next disabled" disabled>
                    Next <ChevronRight size={16} />
                  </button>
                )}
              </div>

              <div className="pagination-info-text">
                Showing 50 items per page • {totalProducts} items total
              </div>
            </nav>
          ) : null}
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      <div className={`filter-drawer-backdrop ${filtersOpen ? "open" : ""}`} onClick={() => setFiltersOpen(false)}>
        <aside className="filter-drawer-sheet" onClick={(e) => e.stopPropagation()}>
          {filterContent}
          <div className="filter-drawer-footer">
            <button type="button" className="button apply-filters-btn" onClick={() => setFiltersOpen(false)}>
              Apply Filters ({totalProducts} items)
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
