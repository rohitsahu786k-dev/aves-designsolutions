import { getFrontPage, getMediaById, getPage, getPages, wpFetch } from "@/lib/wp";
import { decodeHtml, stripHtml } from "@/lib/utils";
import {
  getActiveAnnouncement,
  getActiveOffers,
  normalizeBanners,
  normalizeSiteContact,
} from "@/lib/acf-normalizer";

const storefrontFreshness = { next: { revalidate: 30 } };

/**
 * Fetch Announcement from WordPress CPT `announcement` with priority & date scheduling
 */
export async function getAnnouncementBar() {
  const announcements = await wpFetch(
    "/wp-json/wp/v2/announcements?per_page=20&_embed=1",
    storefrontFreshness
  ).catch(() => []);

  if (Array.isArray(announcements) && announcements.length > 0) {
    const active = getActiveAnnouncement(announcements);
    if (active) {
      return active;
    }
  }

  // Fallback to Front Page ACF
  const frontPage = await getFrontPage(storefrontFreshness).catch(() => null);
  const acfText =
    frontPage?.acf?.top_announcement ||
    frontPage?.acf?.header_announcement ||
    frontPage?.acf?.announcement_text;

  if (acfText) {
    return {
      id: "announcement-frontpage",
      text: stripHtml(acfText).trim(),
      linkLabel: frontPage.acf?.announcement_link_label || "Shop Now",
      linkUrl:
        frontPage.acf?.announcement_link ||
        frontPage.acf?.top_announcement_link ||
        "/shop",
      tone: frontPage.acf?.announcement_tone || "info",
      isDismissible: true,
      isActive: true,
      priority: 1,
    };
  }

  return {
    id: "announcement-default",
    text: "Fast Pan-India Delivery • ISO & DIN Certified High-Tensile Fasteners • Instant GST Invoicing",
    linkLabel: "Shop Screws",
    linkUrl: "/shop",
    tone: "info",
    isDismissible: true,
    isActive: true,
    priority: 0,
  };
}

/**
 * Fetch marquee notice for homepage and banner ticker
 */
export async function getMarqueeNotice() {
  const announcement = await getAnnouncementBar().catch(() => null);
  return announcement?.text || "Fast Pan-India Delivery • ISO & DIN Certified High-Tensile Fasteners • Instant GST Invoicing";
}

/**
 * Fetch Site Banners from CPT `site_banner` filtered by placement and scheduling
 */
export async function getBannersByPlacement(placement = "home_hero") {
  const cptBanners = await wpFetch(
    "/wp-json/wp/v2/site-banners?per_page=50&_embed=1",
    storefrontFreshness
  ).catch(() => []);

  if (Array.isArray(cptBanners) && cptBanners.length > 0) {
    const normalized = normalizeBanners(cptBanners, placement);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  // Fallback banners based on placement
  if (placement === "home_hero") {
    return [
      {
        id: "hero-1",
        placement: "home_hero",
        carouselGroup: "default",
        sortOrder: 0,
        isActive: true,
        desktopImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80",
        tabletImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
        mobileImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        fallbackImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        eyebrow: "PRECISION INDUSTRIAL FASTENERS",
        heading: "High-Tensile Bolts, Screws & Structural Hardware",
        subheading: "Certified Grade 8.8, 10.9 & 12.9 alloy steel and SS 304/316 marine stainless hardware with real-time stock sync.",
        ctaLabel: "Explore All Fasteners",
        ctaUrl: "/shop",
        wholeBannerClickable: false,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#0f172a",
        overlayOpacity: 45,
      },
      {
        id: "hero-2",
        placement: "home_hero",
        carouselGroup: "default",
        sortOrder: 1,
        isActive: true,
        desktopImage: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1600&q=80",
        tabletImage: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=80",
        mobileImage: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
        fallbackImage: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
        eyebrow: "SELF-DRILLING TEK FASTENERS",
        heading: "Engineered For Heavy Metal & PEB Fabrications",
        subheading: "Hardened carbon steel & ruspert coated screws designed for maximum pull-out strength and corrosion resistance.",
        ctaLabel: "Shop Self-Drilling",
        ctaUrl: "/shop?search=self-drilling",
        wholeBannerClickable: false,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#0f172a",
        overlayOpacity: 50,
      },
      {
        id: "hero-3",
        placement: "home_hero",
        carouselGroup: "default",
        sortOrder: 2,
        isActive: true,
        desktopImage: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1600&q=80",
        tabletImage: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
        mobileImage: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
        fallbackImage: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
        eyebrow: "SS 304 & SS 316 MARINE GRADE",
        heading: "Corrosion-Resistant Stainless Fasteners",
        subheading: "Socket head cap screws, hex bolts, spring washers, and nyloc nuts with mill test certification available upon request.",
        ctaLabel: "View Stainless Range",
        ctaUrl: "/shop?material=ss-304",
        wholeBannerClickable: false,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#0f172a",
        overlayOpacity: 45,
      },
    ];
  }

  if (placement === "home_mid_banner") {
    return [
      {
        id: "mid-1",
        placement: "home_mid_banner",
        carouselGroup: "mid",
        sortOrder: 0,
        isActive: true,
        desktopImage: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80",
        tabletImage: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80",
        mobileImage: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
        eyebrow: "CONTRACTOR & OEM WHOLESALE",
        heading: "Direct Carton & Master Pack Sourcing",
        subheading: "Get tailored wholesale tiered pricing, MTC / inspection documentation and dedicated account management for ongoing projects.",
        ctaLabel: "Request Commercial Quotation",
        ctaUrl: "/contact",
        wholeBannerClickable: false,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#0f172a",
        overlayOpacity: 60,
      },
    ];
  }

  return [];
}

/**
 * Fetch Site Offers from CPT `site_offer` filtered by placement and scheduling
 */
export async function getSiteOffers(placement = "homepage") {
  const cptOffers = await wpFetch(
    "/wp-json/wp/v2/site-offers?per_page=20&_embed=1",
    storefrontFreshness
  ).catch(() => []);

  if (Array.isArray(cptOffers) && cptOffers.length > 0) {
    const normalized = getActiveOffers(cptOffers, placement);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [];
}

/**
 * Fetch Site Contact & Global Settings from CPT `site_contact`
 */
export async function getStoreContactInfo() {
  const contactPosts = await wpFetch(
    "/wp-json/wp/v2/site-contact?per_page=1&_embed=1",
    storefrontFreshness
  ).catch(() => []);

  if (Array.isArray(contactPosts) && contactPosts.length > 0 && contactPosts[0]) {
    return normalizeSiteContact(contactPosts[0]);
  }

  return normalizeSiteContact(null);
}

/**
 * Policy Pages
 */
export async function getPolicyPages() {
  const pages = await getPages({ per_page: "100" }).catch(() => []);
  const policyPattern = /(privacy|refund|return|exchange|shipping|terms|condition|cancellation)/i;
  return pages
    .filter((page) => policyPattern.test(`${page.slug} ${page.title?.rendered || ""}`))
    .map((page) => ({
      id: page.id,
      slug: page.slug,
      label: decodeHtml(page.title?.rendered || page.slug),
      href: `/pages/${page.slug}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
