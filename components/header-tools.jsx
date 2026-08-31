"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Heart, HelpCircle, LogIn, Menu, MessageCircle, Offer, Package, Search, ShoppingBag, Sparkles, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { decodeHtml } from "@/lib/utils";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918107753647";

export function HeaderTools({ menu = [], categories = [] }) {
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCategory, setOpenCategory] = useState(true);
  const [expandedParents, setExpandedParents] = useState({});

  useEffect(() => {
    const openSearch = () => setPanel("search");
    const openMenu = () => setPanel("menu");
    window.addEventListener("screwnet:search-open", openSearch);
    window.addEventListener("screwnet:menu-open", openMenu);
    return () => {
      window.removeEventListener("screwnet:search-open", openSearch);
      window.removeEventListener("screwnet:menu-open", openMenu);
    };
  }, []);

  useEffect(() => {
    if (!panel) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [panel]);

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(clean)}`, { signal: controller.signal }).catch(() => null);
      if (response?.ok) setSuggestions((await response.json()).suggestions || []);
      else setSuggestions([]);
      setLoading(false);
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const toggleParent = (id) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const roots = menu.filter((item) => !item.parent);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi screwnet, I need assistance with an order.")}`;

  return (
    <>
      <div className="header-utilities">
        <button type="button" className="modern-menu-btn" onClick={() => setPanel("menu")} aria-label="Open Navigation Menu">
          <Menu size={24} className="menu-icon" />
        </button>
        <button type="button" className="desktop-search-util-btn" onClick={() => setPanel("search")} aria-label="Search Catalog">
          <Search size={16} />
          <span>Search</span>
        </button>
      </div>

      {panel ? (
        <div className="header-panel-backdrop" onClick={() => setPanel(null)}>
          <aside
            className={`header-panel myntra-sidebar-panel ${panel === "menu" ? "myntra-style-menu" : "search-panel"}`}
            onClick={(event) => event.stopPropagation()}
          >
            {panel === "search" ? (
              <div className="live-search-wrapper">
                <div className="header-panel-title">
                  <strong>Search Store</strong>
                  <button type="button" className="close-panel-btn" onClick={() => setPanel(null)} aria-label="Close search">
                    <X size={20} />
                  </button>
                </div>
                <div className="live-search">
                  <form action="/shop" onSubmit={() => setPanel(null)}>
                    <input
                      autoFocus
                      name="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search M5x20, DIN 912, SS 304, socket cap, drywall screws..."
                      autoComplete="off"
                    />
                    <button aria-label="Submit search" type="submit">
                      <Search size={18} />
                    </button>
                  </form>
                  {!query && (
                    <div className="search-quick-pills">
                      <span>Popular Searches:</span>
                      <Link href="/shop?search=M5" onClick={() => setPanel(null)}>M5 Screws</Link>
                      <Link href="/shop?search=DIN+912" onClick={() => setPanel(null)}>DIN 912 Socket Cap</Link>
                      <Link href="/shop?material=ss-304" onClick={() => setPanel(null)}>SS 304 Marine</Link>
                      <Link href="/shop?search=drywall" onClick={() => setPanel(null)}>Drywall Screws</Link>
                      <Link href="/shop?search=self-drilling" onClick={() => setPanel(null)}>Self-Drilling Tek</Link>
                      <Link href="/shop?search=Grade+12.9" onClick={() => setPanel(null)}>Grade 12.9</Link>
                    </div>
                  )}
                  <div className="search-results">
                    {loading && query.trim().length >= 2 ? (
                      <p className="search-loading">Searching FiboSearch index...</p>
                    ) : null}
                    {!loading &&
                      query.trim().length >= 2 &&
                      suggestions.map((item) => (
                        <Link
                          href={item.href}
                          key={`${item.type}-${item.id}`}
                          onClick={() => setPanel(null)}
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
                              {item.sku && <span className="fibosearch-sku-tag">SKU: {item.sku}</span>}
                              {item.type === "category" && <span className="fibosearch-cat-tag">Category</span>}
                              {item.price && <strong className="fibosearch-price">₹{parseFloat(item.price).toFixed(2)}</strong>}
                            </div>
                          </div>
                          <ChevronRight size={15} className="fibosearch-arrow" />
                        </Link>
                      ))}
                    {!loading && query.trim().length >= 2 && !suggestions.length ? (
                      <p className="search-empty">No instant matches found. Press enter to search full shop catalog.</p>
                    ) : null}
                    {suggestions.length > 0 && (
                      <div className="mobile-fibosearch-footer">
                        <span className="fibosearch-engine-brand">FiboSearch Engine</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="myntra-menu-container">
                {/* Myntra style User Banner Header */}
                <div className="myntra-user-banner">
                  <div className="user-avatar">
                    <User size={22} />
                  </div>
                  <div className="user-greeting">
                    <h3>Welcome Guest</h3>
                    <p>To access orders, wishlist & offers</p>
                  </div>
                  <Link href="/account" onClick={() => setPanel(null)} className="myntra-login-btn">
                    Sign In / Join <LogIn size={13} />
                  </Link>
                  <button type="button" className="myntra-close-btn" onClick={() => setPanel(null)} aria-label="Close menu">
                    <X size={20} />
                  </button>
                </div>

                <nav className="myntra-menu-nav">
                  {/* Category Section Accordion */}
                  <div className="myntra-nav-section">
                    <div className="myntra-section-header" onClick={() => setOpenCategory(!openCategory)}>
                      <span>Shop by Category</span>
                      <ChevronDown size={16} className={`chevron-icon ${openCategory ? "open" : ""}`} />
                    </div>
                    {openCategory && (
                      <div className="myntra-category-list">
                        {categories.slice(0, 20).map((category) => (
                          <Link href={`/category/${category.slug}`} key={category.id} onClick={() => setPanel(null)} className="myntra-cat-link">
                            <span className="cat-name">{decodeHtml(category.name)}</span>
                            {category.count > 0 && <span className="cat-count">{category.count}</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* WordPress Primary Menu roots */}
                  <div className="myntra-nav-section">
                    <span className="myntra-section-title">Navigation</span>
                    {roots.map((item) => {
                      const children = menu.filter((child) => child.parent === item.id);
                      const isExpanded = expandedParents[item.id];
                      return (
                        <div key={item.id} className="myntra-menu-item-group">
                          <div className="myntra-menu-row">
                            <Link href={item.href} onClick={() => setPanel(null)} className="myntra-main-link">
                              {decodeHtml(item.label)}
                            </Link>
                            {children.length > 0 && (
                              <button type="button" className="sub-toggle-btn" onClick={() => toggleParent(item.id)}>
                                <ChevronDown size={14} className={`chevron-icon ${isExpanded ? "open" : ""}`} />
                              </button>
                            )}
                          </div>
                          {children.length > 0 && isExpanded && (
                            <div className="myntra-sub-list">
                              {children.map((child) => (
                                <Link href={child.href} key={child.id} onClick={() => setPanel(null)}>
                                  {decodeHtml(child.label)}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Services & Support */}
                  <div className="myntra-nav-section quick-services">
                    <span className="myntra-section-title">Quick Links</span>
                    <Link href="/shop?on_sale=true" onClick={() => setPanel(null)} className="quick-service-link highlight">
                      <Sparkles size={16} /> <span>Special Offers & Deals</span>
                    </Link>
                    <Link href="/account" onClick={() => setPanel(null)} className="quick-service-link">
                      <Package size={16} /> <span>Orders & Account</span>
                    </Link>
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" className="quick-service-link whatsapp">
                      <MessageCircle size={16} /> <span>WhatsApp Support</span>
                    </a>
                    <Link href="/contact" onClick={() => setPanel(null)} className="quick-service-link">
                      <HelpCircle size={16} /> <span>Contact & FAQs</span>
                    </Link>
                  </div>
                </nav>

                <div className="myntra-footer-credit">
                  <p>screwnet</p>
                  <small>Industrial Screws & Fasteners</small>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
}


