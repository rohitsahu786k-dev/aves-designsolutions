import { getFrontPage, getMediaById, getPage, getPages, wpFetch } from "@/lib/wp";
import { decodeHtml, stripHtml } from "@/lib/utils";
import {
  getActiveAnnouncement,
  getActiveOffers,
  normalizeBanners,
  normalizeSiteContact,
} from "@/lib/acf-normalizer";

const storefrontFreshness = { next: { revalidate: 30 } };

async function getLegacyStoreData() {
  const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout
    ? AbortSignal.timeout(3500)
    : undefined;
  return wpFetch("/wp-json/screwnet/v1/store-data", {
    ...storefrontFreshness,
    signal,
  }).catch(() => null);
}

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

  // Check Front Page ACF Banners
  if (placement === "home_hero") {
    const frontPage = await getFrontPage(storefrontFreshness).catch(() => null);
    const frontAcf = frontPage?.acf || {};

    if (Array.isArray(frontAcf.hero_banners) && frontAcf.hero_banners.length > 0) {
      return frontAcf.hero_banners.map((b, index) => ({
        id: `front-hero-${index}`,
        placement: "home_hero",
        carouselGroup: "default",
        sortOrder: index,
        isActive: true,
        desktopImage: b.desktop_image || b.image || b.desktopImage || b.url,
        tabletImage: b.tablet_image || b.desktop_image || b.image,
        mobileImage: b.mobile_image || b.desktop_image || b.image,
        fallbackImage: b.image || b.desktop_image,
        eyebrow: b.eyebrow || "PRECISION INDUSTRIAL FASTENERS",
        heading: b.heading || b.title || "High-Tensile Bolts & Screws",
        subheading: b.subheading || b.description || "",
        ctaLabel: b.cta_label || b.ctaLabel || "Explore Catalog",
        ctaUrl: b.cta_url || b.ctaUrl || "/shop",
        wholeBannerClickable: true,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#000000",
        overlayOpacity: 0,
      }));
    }

    if (frontAcf.banner_desktop) {
      return [
        {
          id: "front-hero-single",
          placement: "home_hero",
          carouselGroup: "default",
          sortOrder: 0,
          isActive: true,
          desktopImage: frontAcf.banner_desktop,
          tabletImage: frontAcf.banner_desktop,
          mobileImage: frontAcf.banner_mobile || frontAcf.banner_desktop,
          fallbackImage: frontAcf.banner_desktop,
          eyebrow: frontAcf.hero_eyebrow || "PRECISION INDUSTRIAL FASTENERS",
          heading: frontAcf.hero_heading || "High-Tensile Bolts & Screws",
          subheading: frontAcf.hero_subheading || "",
          ctaLabel: "Shop Fasteners",
          ctaUrl: "/shop",
          wholeBannerClickable: true,
          openNewTab: false,
          textAlignment: "left",
          contentTheme: "light",
          overlayColor: "#000000",
          overlayOpacity: 0,
        },
      ];
    }
  }

  if (placement === "home_hero") {
    const legacy = await getLegacyStoreData();
    if (Array.isArray(legacy?.banners) && legacy.banners.length > 0) {
      return legacy.banners
        .filter((banner) => banner.image || banner.desktopImage)
        .map((banner, index) => ({
          id: banner.id || `legacy-hero-${index}`,
          placement: "home_hero",
          carouselGroup: "default",
          sortOrder: index,
          isActive: true,
          desktopImage: banner.desktopImage || banner.image,
          tabletImage: banner.tabletImage || banner.desktopImage || banner.image,
          mobileImage: banner.mobileImage || banner.desktopImage || banner.image,
          fallbackImage: banner.image || banner.desktopImage,
          eyebrow: banner.eyebrow || "",
          heading: banner.heading || banner.title || "",
          subheading: banner.subheading || banner.text || "",
          ctaLabel: banner.ctaLabel || "Shop Now",
          ctaUrl: banner.href || banner.ctaUrl || "/shop",
          wholeBannerClickable: true,
          openNewTab: false,
          textAlignment: "left",
          contentTheme: "light",
          overlayColor: "#0f172a",
          overlayOpacity: 0,
        }));
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
        desktopImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-desktop-banner.webp",
        tabletImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-desktop-banner.webp",
        mobileImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-mobile-banner.webp",
        fallbackImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-precision-industrial-fasteners-desktop-banner.webp",
        eyebrow: "PRECISION INDUSTRIAL FASTENERS",
        heading: "High-Tensile Bolts, Screws & Structural Hardware",
        subheading: "Certified Grade 8.8, 10.9 & 12.9 alloy steel and SS 304/316 marine stainless hardware with real-time stock sync.",
        ctaLabel: "Explore All Fasteners",
        ctaUrl: "/shop",
        wholeBannerClickable: true,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#0f172a",
        overlayOpacity: 0,
      },
      {
        id: "hero-2",
        placement: "home_hero",
        carouselGroup: "default",
        sortOrder: 1,
        isActive: true,
        desktopImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-bulk-screws-bolts-hardware-desktop-banner.webp",
        tabletImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-bulk-screws-bolts-hardware-desktop-banner.webp",
        mobileImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-engineered-for-every-build-mobile-banner.webp",
        fallbackImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-bulk-screws-bolts-hardware-desktop-banner.webp",
        eyebrow: "ENGINEERED FOR EVERY BUILD",
        heading: "Bulk Industrial Screws, Bolts & Hardware",
        subheading: "Hardened carbon steel & ruspert coated screws engineered for maximum pull-out strength and structural durability.",
        ctaLabel: "Shop Bulk Hardware",
        ctaUrl: "/shop",
        wholeBannerClickable: true,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#0f172a",
        overlayOpacity: 0,
      },
      {
        id: "hero-3",
        placement: "home_hero",
        carouselGroup: "default",
        sortOrder: 2,
        isActive: true,
        desktopImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-reliable-industrial-supply-desktop-banner.webp",
        tabletImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-reliable-industrial-supply-desktop-banner.webp",
        mobileImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-stainless-steel-screws-bolts-mobile-banner.webp",
        fallbackImage: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet-reliable-industrial-supply-desktop-banner.webp",
        eyebrow: "RELIABLE INDUSTRIAL SUPPLY",
        heading: "Corrosion-Resistant Stainless Fasteners",
        subheading: "Socket head cap screws, hex bolts, spring washers, and nyloc nuts with mill test certification available.",
        ctaLabel: "View Stainless Range",
        ctaUrl: "/shop?search=stainless",
        wholeBannerClickable: true,
        openNewTab: false,
        textAlignment: "left",
        contentTheme: "light",
        overlayColor: "#0f172a",
        overlayOpacity: 0,
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
  const siteSettings = await wpFetch("/wp-json/screwnet/v1/site-settings", storefrontFreshness).catch(() => null);
  if (siteSettings?.contact) {
    return normalizeSiteContact({
      acf: {
        sales_email: siteSettings.contact.email,
        support_email: siteSettings.contact.email,
        contact_email: siteSettings.contact.email,
        phone_primary: siteSettings.contact.phone,
        whatsapp_number: siteSettings.contact.whatsapp_number,
        address_line_1: siteSettings.contact.address,
        support_hours: siteSettings.contact.working_hours,
      },
    });
  }

  const contactPosts = await wpFetch(
    "/wp-json/wp/v2/site-contact?per_page=1&_embed=1",
    storefrontFreshness
  ).catch(() => []);

  if (Array.isArray(contactPosts) && contactPosts.length > 0 && contactPosts[0]) {
    return normalizeSiteContact(contactPosts[0]);
  }

  const legacy = await getLegacyStoreData();
  if (legacy?.contact) {
    return normalizeSiteContact({
      acf: {
        phone_primary: legacy.contact.phone,
        whatsapp_number: legacy.contact.whatsapp,
        sales_email: legacy.contact.email,
        support_email: legacy.contact.email,
        address_line_1: legacy.contact.address,
        support_hours: legacy.contact.working_hours,
      },
    });
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
