import Link from "next/link";
import { ChevronDown, Headphones, Search, UserRound } from "lucide-react";
import { getCategories } from "@/lib/wp";
import { getPrimaryMenu } from "@/lib/wp-menus";
import { getAnnouncementBar } from "@/lib/wp-storefront";
import { AnnouncementBar } from "@/components/announcement-bar";
import { HeaderTools } from "@/components/header-tools";
import { WishlistNavLink } from "@/components/wishlist-button";
import { CartNavLink } from "@/components/cart-nav-link";
import { decodeHtml } from "@/lib/utils";

const fallbackNav = [
  { id: "home", label: "Home", href: "/", parent: 0 },
  { id: "shop", label: "Catalog", href: "/shop", parent: 0 },
  { id: "screws", label: "Screws", href: "/shop?search=screw", parent: 0 },
  { id: "bolts", label: "Bolts", href: "/shop?search=bolt", parent: 0 },
  { id: "bulk", label: "Bulk RFQ", href: "/contact", parent: 0 },
  { id: "blog", label: "Technical Guides", href: "/blog", parent: 0 },
  { id: "contact", label: "Help & Support", href: "/contact", parent: 0 },
];

export async function Header() {
  const [categories, wordpressMenu, announcement] = await Promise.all([
    getCategories().catch(() => []),
    getPrimaryMenu().catch(() => []),
    getAnnouncementBar().catch(() => null),
  ]);

  const featuredCategories = categories.filter((category) => category.count > 0).slice(0, 18);
  const menu = wordpressMenu.length ? wordpressMenu : fallbackNav;
  const topLevelItems = menu.filter((item) => !item.parent);

  return (
    <header className="site-header">
      {/* 1. Dynamic Top Announcement Bar from CMS */}
      <AnnouncementBar announcement={announcement} />

      <div className="container nav-row">
        <HeaderTools menu={menu} categories={featuredCategories} />

        <Link className="brand screwnet-brand" href="/" aria-label="screwnet homepage">
          <span className="brand-logo-text">
            <span className="brand-logo-main">screw</span>
            <span className="brand-logo-accent">net</span>
          </span>
          <span className="brand-logo-sub">.in</span>
        </Link>

        <nav className="main-nav" aria-label="Primary navigation">
          {topLevelItems.map((item) => {
            const children = menu.filter((child) => child.parent === item.id);
            const showCategoryMega = /shop|fastener|categor|screw|bolt/i.test(item.label);
            if (!children.length && !showCategoryMega) {
              return (
                <Link key={item.id} href={item.href}>
                  {decodeHtml(item.label)}
                </Link>
              );
            }
            return (
              <div className="mega-trigger" key={item.id}>
                <Link href={item.href}>
                  {decodeHtml(item.label)} <ChevronDown size={13} className="mega-arrow" />
                </Link>
                <div className="mega-menu">
                  <div className="mega-copy">
                    <span className="eyebrow">Fastener Catalog</span>
                    <h3>{decodeHtml(item.label)}</h3>
                    <p>High-tensile bolts, self-drilling screws, stainless marine fasteners and precision engineering hardware.</p>
                    <Link href="/shop" className="mega-cta-link">
                      View Full Warehouse Catalog &rarr;
                    </Link>
                  </div>
                  <div className="mega-links">
                    {children.map((child) => (
                      <Link href={child.href} key={child.id}>
                        <span>{decodeHtml(child.label)}</span>
                      </Link>
                    ))}
                    {showCategoryMega &&
                      featuredCategories.map((category) => (
                        <Link href={`/category/${category.slug}`} key={`category-${category.id}`}>
                          <span>{decodeHtml(category.name)}</span>
                          <small>{category.count} items</small>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="nav-actions">
          <Link className="header-text-link nav-support-pill" href="/contact">
            <Headphones size={14} />
            <span>Bulk Order</span>
          </Link>
          <WishlistNavLink />
          <Link className="icon-button" href="/account" aria-label="My Account">
            <UserRound size={18} />
          </Link>
          <CartNavLink />
        </div>
      </div>
    </header>
  );
}

