import Link from "next/link";
import { ChevronDown, Download, FileText, Headphones, Mail, PackageCheck, Phone, ReceiptText, UserRound } from "lucide-react";
import { getCategories } from "@/lib/wp";
import { getPrimaryMenu } from "@/lib/wp-menus";
import { getAnnouncementBar } from "@/lib/wp-storefront";
import { AnnouncementBar } from "@/components/announcement-bar";
import { HeaderTools } from "@/components/header-tools";
import { HeaderSearchBar } from "@/components/header-search-bar";
import { HeaderCategoryDropdown } from "@/components/header-category-dropdown";
import { HeaderSearchTrigger } from "@/components/header-search-trigger";
import { WishlistNavLink } from "@/components/wishlist-button";
import { CartNavLink } from "@/components/cart-nav-link";
import { decodeHtml } from "@/lib/utils";
import { getStoreContactInfo } from "@/lib/wp-storefront";

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
  const [categories, wordpressMenu, announcement, contact] = await Promise.all([
    getCategories().catch(() => []),
    getPrimaryMenu().catch(() => []),
    getAnnouncementBar().catch(() => null),
    getStoreContactInfo().catch(() => ({})),
  ]);

  const featuredCategories = categories.filter((category) => category.slug !== "uncategorized").slice(0, 36);
  const menu = wordpressMenu.length ? wordpressMenu : fallbackNav;
  const topLevelItems = menu.filter((item) => !item.parent);
  const phoneDisplay = contact.phonePrimary || "+91 81077 53647";
  const phoneRaw = phoneDisplay.replace(/[^0-9+]/g, "");
  const salesEmail = contact.salesEmail || "sales@screwnet.in";

  return (
    <header className="site-header pro-site-header">
      <div className="pro-header-top">
        <div className="container pro-header-top-inner">
          <div className="pro-header-contact">
            <a href={`tel:${phoneRaw}`}><Phone size={13} /> <span>{phoneDisplay}</span></a>
            <a href={`mailto:${salesEmail}`}><Mail size={13} /> <span>{salesEmail}</span></a>
          </div>
          <div className="pro-header-services">
            <Link href="/contact"><FileText size={13} /> <span>Bulk RFQ</span></Link>
            <Link href="/track-order"><PackageCheck size={13} /> <span>Track Order</span></Link>
            <Link href="/shop"><Download size={13} /> <span>Download Catalog</span></Link>
            <Link href="/pages/terms-and-conditions"><ReceiptText size={13} /> <span>GST Invoice</span></Link>
            <span className="pro-currency-pill">IN | INR</span>
          </div>
        </div>
      </div>

      <div className="container nav-row pro-header-main">
        <HeaderTools menu={menu} categories={featuredCategories} whatsappNumber={contact.whatsappNumber} />

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
                          <small>{Number(category.count || 0) > 0 ? `${category.count} items` : "New"}</small>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="nav-actions">
          <HeaderSearchTrigger />
          <Link className="header-text-link nav-support-pill" href="/contact">
            <Headphones size={14} />
            <span>Bulk RFQ</span>
          </Link>
          <WishlistNavLink />
          <Link className="icon-button" href="/account" aria-label="My Account">
            <UserRound size={18} />
          </Link>
          <CartNavLink />
        </div>
      </div>

      <div className="pro-header-search-row">
        <div className="container pro-header-search-inner">
          <HeaderCategoryDropdown categories={featuredCategories} />
          <HeaderSearchBar />
        </div>
      </div>

      <div className="pro-announcement-wrap">
        <AnnouncementBar announcement={announcement} />
      </div>
    </header>
  );
}

