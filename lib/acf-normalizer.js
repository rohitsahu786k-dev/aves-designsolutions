import { cleanDescriptionHtml, decodeHtml, stripHtml } from "@/lib/utils";

/**
 * Normalizes ACF image/file fields whether returned as URL string, ID, or array/object.
 */
export function resolveAcfMediaUrl(media) {
  if (!media) return "";
  if (typeof media === "string") return media.trim();
  if (typeof media === "object") {
    return media.url || media.src || media.source_url || "";
  }
  return "";
}

/**
 * Checks if a scheduled item is currently active based on starts_at and ends_at.
 */
export function isScheduleActive(startsAt, endsAt, isActive = true) {
  if (isActive === false || isActive === 0 || isActive === "0") return false;
  const now = new Date();
  if (startsAt) {
    const start = new Date(startsAt);
    if (!isNaN(start.getTime()) && now < start) return false;
  }
  if (endsAt) {
    const end = new Date(endsAt);
    if (!isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

/**
 * Normalizes Custom Product Fields from ACF schema:
 * group_9f969bc44062d (WooCommerce Screw Product - Custom Technical & PDP Fields)
 */
export function normalizeAcfProduct(rawProduct, acfData = null) {
  const acf = acfData || rawProduct?.acf || rawProduct?.meta_data_acf || {};

  // Merchandising
  const productSubtitle = acf.product_subtitle ? decodeHtml(String(acf.product_subtitle)).trim() : "";
  const productBadge = acf.product_badge ? decodeHtml(String(acf.product_badge)).trim() : "";
  const familyModelCode = acf.family_model_code ? decodeHtml(String(acf.family_model_code)).trim() : "";
  const mpn = acf.manufacturer_part_number ? decodeHtml(String(acf.manufacturer_part_number)).trim() : "";
  
  const pdpHighlightsRaw = acf.pdp_highlights || "";
  const pdpHighlights = typeof pdpHighlightsRaw === "string"
    ? pdpHighlightsRaw
        .split("\n")
        .map((line) => decodeHtml(line.trim()))
        .filter((line) => line.length > 0)
    : Array.isArray(pdpHighlightsRaw)
    ? pdpHighlightsRaw.map((h) => decodeHtml(String(h).trim())).filter(Boolean)
    : [];

  // Fastener Technical Data
  const threadToleranceClass = acf.thread_tolerance_class ? decodeHtml(String(acf.thread_tolerance_class)).trim() : "";
  
  const threadDirectionMap = {
    right_hand: "Right Hand",
    left_hand: "Left Hand",
  };
  const threadDirection = acf.thread_direction
    ? threadDirectionMap[acf.thread_direction] || decodeHtml(String(acf.thread_direction))
    : "";

  const threadCoverageMap = {
    fully_threaded: "Fully Threaded",
    partially_threaded: "Partially Threaded",
    varies_by_variant: "Varies by Variant",
  };
  const threadCoverage = acf.thread_coverage
    ? threadCoverageMap[acf.thread_coverage] || decodeHtml(String(acf.thread_coverage))
    : "";

  const recommendedDriverTool = acf.recommended_driver_tool ? decodeHtml(String(acf.recommended_driver_tool)).trim() : "";
  const recommendedTorque = acf.recommended_torque ? decodeHtml(String(acf.recommended_torque)).trim() : "";
  const technicalSpecificationTable = acf.technical_specification_table ? cleanDescriptionHtml(String(acf.technical_specification_table)) : "";
  const technicalNotes = acf.technical_notes ? decodeHtml(String(acf.technical_notes)).trim() : "";

  // Compliance, Origin & Identification
  const hsnCode = acf.hsn_code ? String(acf.hsn_code).trim() : "";
  const countryOfOrigin = acf.country_of_origin ? decodeHtml(String(acf.country_of_origin)).trim() : "";
  const standardReferenceNote = acf.standard_reference_note ? decodeHtml(String(acf.standard_reference_note)).trim() : "";
  const rohsCompliant = Boolean(acf.rohs_compliant);
  const reachCompliant = Boolean(acf.reach_compliant);
  const materialCertificateAvailable = Boolean(acf.material_certificate_available);
  const madeInIndia = Boolean(acf.made_in_india);
  const complianceNotes = acf.compliance_notes ? decodeHtml(String(acf.compliance_notes)).trim() : "";

  // Drawings & Downloads
  const dimensionDrawing = resolveAcfMediaUrl(acf.dimension_drawing);
  const technicalDatasheetPdf = resolveAcfMediaUrl(acf.technical_datasheet_pdf);
  const cadStepFile = resolveAcfMediaUrl(acf.cad_step_file);
  const certificateDocument = resolveAcfMediaUrl(acf.certificate_document);

  const hasDownloads = Boolean(
    dimensionDrawing || technicalDatasheetPdf || cadStepFile || certificateDocument
  );

  // Applications & Support Content
  const applicationsContent = acf.applications_content ? cleanDescriptionHtml(String(acf.applications_content)) : "";
  const installationToolNotes = acf.installation_tool_notes ? cleanDescriptionHtml(String(acf.installation_tool_notes)) : "";
  const compatibilityContent = acf.compatibility_content ? cleanDescriptionHtml(String(acf.compatibility_content)) : "";
  const whatsInThePack = acf.whats_in_the_pack ? decodeHtml(String(acf.whats_in_the_pack)).trim() : "";
  const storageCareNotes = acf.storage_care_notes ? decodeHtml(String(acf.storage_care_notes)).trim() : "";
  const warrantyText = acf.warranty_text ? decodeHtml(String(acf.warranty_text)).trim() : "";

  // Commerce Extras
  const moq = Math.max(1, parseInt(acf.minimum_order_quantity, 10) || 1);
  const quantityStep = Math.max(1, parseInt(acf.quantity_step, 10) || 1);
  const dispatchLeadTime = acf.dispatch_lead_time ? decodeHtml(String(acf.dispatch_lead_time)).trim() : "";
  const bulkEnquiryEnabled = acf.bulk_enquiry_enabled !== false && acf.bulk_enquiry_enabled !== 0 && acf.bulk_enquiry_enabled !== "0";
  const bulkEnquiryLabel = acf.bulk_enquiry_label ? decodeHtml(String(acf.bulk_enquiry_label)).trim() : "Request Bulk Quote";
  const bulkEnquiryUrl = acf.bulk_enquiry_url ? String(acf.bulk_enquiry_url).trim() : "";
  const bulkPricingNote = acf.bulk_pricing_note ? decodeHtml(String(acf.bulk_pricing_note)).trim() : "";
  const productShippingNote = acf.product_shipping_note ? decodeHtml(String(acf.product_shipping_note)).trim() : "";

  // Professional PDP Sections
  const whyBuyContent = acf.why_buy_content ? cleanDescriptionHtml(String(acf.why_buy_content)) : "";
  const qualityAssuranceContent = acf.quality_assurance_content ? cleanDescriptionHtml(String(acf.quality_assurance_content)) : "";
  const faqContent = acf.faq_content ? cleanDescriptionHtml(String(acf.faq_content)) : "";

  return {
    // Merchandising
    productSubtitle,
    productBadge,
    familyModelCode,
    mpn,
    pdpHighlights,

    // Fastener Technical Data
    threadToleranceClass,
    threadDirection,
    threadCoverage,
    recommendedDriverTool,
    recommendedTorque,
    technicalSpecificationTable,
    technicalNotes,

    // Compliance
    hsnCode,
    countryOfOrigin,
    standardReferenceNote,
    rohsCompliant,
    reachCompliant,
    materialCertificateAvailable,
    madeInIndia,
    complianceNotes,

    // Downloads
    dimensionDrawing,
    technicalDatasheetPdf,
    cadStepFile,
    certificateDocument,
    hasDownloads,

    // Usage & Content
    applicationsContent,
    installationToolNotes,
    compatibilityContent,
    whatsInThePack,
    storageCareNotes,
    warrantyText,

    // Commerce Extras
    moq,
    quantityStep,
    dispatchLeadTime,
    bulkEnquiryEnabled,
    bulkEnquiryLabel,
    bulkEnquiryUrl,
    bulkPricingNote,
    productShippingNote,

    // PDP WYSIWYG Sections
    whyBuyContent,
    qualityAssuranceContent,
    faqContent,
  };
}

/**
 * Normalizes Site Banners from post type `site_banner`
 */
export function normalizeBanner(post) {
  if (!post) return null;
  const acf = post.acf || {};
  const isDirectActive = acf.is_active !== false && acf.is_active !== 0 && acf.is_active !== "0";
  const active = isScheduleActive(acf.starts_at, acf.ends_at, isDirectActive);

  const desktopImage = resolveAcfMediaUrl(acf.desktop_image) || resolveAcfMediaUrl(post._embedded?.["wp:featuredmedia"]?.[0]);
  const mobileImage = resolveAcfMediaUrl(acf.mobile_image) || desktopImage;
  const tabletImage = resolveAcfMediaUrl(acf.tablet_image) || desktopImage;
  const fallbackImage = resolveAcfMediaUrl(acf.fallback_image) || mobileImage;

  if (!desktopImage && !mobileImage) return null;

  return {
    id: post.id || `banner-${Math.random()}`,
    placement: acf.placement || "home_hero",
    carouselGroup: acf.carousel_group || "default",
    sortOrder: parseInt(acf.sort_order, 10) || 0,
    isActive: active,
    startsAt: acf.starts_at || null,
    endsAt: acf.ends_at || null,
    desktopImage,
    tabletImage,
    mobileImage,
    fallbackImage,
    eyebrow: acf.eyebrow ? decodeHtml(String(acf.eyebrow)).trim() : "",
    heading: acf.heading ? decodeHtml(String(acf.heading)).trim() : decodeHtml(post.title?.rendered || ""),
    subheading: acf.subheading ? decodeHtml(String(acf.subheading)).trim() : "",
    ctaLabel: acf.cta_label ? decodeHtml(String(acf.cta_label)).trim() : "Shop Now",
    ctaUrl: acf.cta_url ? String(acf.cta_url).trim() : "/shop",
    wholeBannerClickable: acf.whole_banner_clickable !== false && acf.whole_banner_clickable !== 0 && acf.whole_banner_clickable !== "0",
    openNewTab: Boolean(acf.open_new_tab),
    textAlignment: acf.text_alignment || "left",
    contentTheme: acf.content_theme || "auto",
    overlayColor: acf.overlay_color || "",
    overlayOpacity: acf.overlay_opacity !== undefined && acf.overlay_opacity !== "" ? parseInt(acf.overlay_opacity, 10) : 40,
  };
}

/**
 * Filter and sort banners by placement and group
 */
export function normalizeBanners(posts = [], placement = "home_hero") {
  if (!Array.isArray(posts)) return [];
  return posts
    .map(normalizeBanner)
    .filter((b) => b && b.isActive && (!placement || b.placement === placement))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Normalizes Announcements from post type `announcement`
 */
export function normalizeAnnouncement(post) {
  if (!post) return null;
  const acf = post.acf || {};
  const isDirectActive = acf.is_active !== false && acf.is_active !== 0 && acf.is_active !== "0";
  const active = isScheduleActive(acf.starts_at, acf.ends_at, isDirectActive);

  const announcementText = acf.announcement_text
    ? decodeHtml(String(acf.announcement_text)).trim()
    : decodeHtml(post.title?.rendered || "").trim();

  if (!announcementText) return null;

  return {
    id: post.id || `announcement-${Math.random()}`,
    text: announcementText,
    linkLabel: acf.link_label ? decodeHtml(String(acf.link_label)).trim() : "",
    linkUrl: acf.link_url ? String(acf.link_url).trim() : "/shop",
    tone: acf.announcement_tone || "info",
    isDismissible: acf.is_dismissible !== false && acf.is_dismissible !== 0 && acf.is_dismissible !== "0",
    isActive: active,
    priority: parseInt(acf.priority, 10) || 0,
    startsAt: acf.starts_at || null,
    endsAt: acf.ends_at || null,
  };
}

/**
 * Get the highest priority active announcement
 */
export function getActiveAnnouncement(posts = []) {
  if (!Array.isArray(posts) || !posts.length) return null;
  const activeAnnouncements = posts
    .map(normalizeAnnouncement)
    .filter((a) => a && a.isActive)
    .sort((a, b) => b.priority - a.priority);

  return activeAnnouncements[0] || null;
}

/**
 * Normalizes Site Offers from post type `site_offer`
 */
export function normalizeOffer(post) {
  if (!post) return null;
  const acf = post.acf || {};
  const isDirectActive = acf.is_active !== false && acf.is_active !== 0 && acf.is_active !== "0";
  const active = isScheduleActive(acf.starts_at, acf.ends_at, isDirectActive);

  const offerBadge = acf.offer_badge ? decodeHtml(String(acf.offer_badge)).trim() : "";
  const couponCode = acf.coupon_code ? String(acf.coupon_code).trim().toUpperCase() : "";
  const offerDescription = acf.offer_description ? decodeHtml(String(acf.offer_description)).trim() : "";

  return {
    id: post.id || `offer-${Math.random()}`,
    title: decodeHtml(post.title?.rendered || offerBadge || "Special Offer"),
    badge: offerBadge,
    offerType: acf.offer_type || "percentage",
    discountValue: parseFloat(acf.discount_value) || 0,
    couponCode,
    minimumOrderAmount: parseFloat(acf.minimum_order_amount) || 0,
    maximumDiscount: parseFloat(acf.maximum_discount) || 0,
    description: offerDescription,
    isActive: active,
    desktopImage: resolveAcfMediaUrl(acf.desktop_offer_image),
    mobileImage: resolveAcfMediaUrl(acf.mobile_offer_image),
    ctaLabel: acf.cta_label ? decodeHtml(String(acf.cta_label)).trim() : "Claim Offer",
    ctaUrl: acf.cta_url ? String(acf.cta_url).trim() : "/shop",
    placement: acf.placement || "homepage",
    priority: parseInt(acf.priority, 10) || 0,
  };
}

/**
 * Get active offers filtered by placement
 */
export function getActiveOffers(posts = [], placement = "") {
  if (!Array.isArray(posts)) return [];
  return posts
    .map(normalizeOffer)
    .filter((o) => o && o.isActive && (!placement || o.placement === placement || o.placement === "sitewide"))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Normalizes Site Contact & Global Settings from post type `site_contact`
 */
export function normalizeSiteContact(post) {
  const acf = post?.acf || {};

  const companyName = acf.company_name ? decodeHtml(String(acf.company_name)).trim() : "screwnet Industrial Fasteners";
  const displayName = acf.display_name ? decodeHtml(String(acf.display_name)).trim() : "screwnet";
  const logoDark = resolveAcfMediaUrl(acf.logo_dark);
  const logoLight = resolveAcfMediaUrl(acf.logo_light);
  const gstin = acf.gstin ? String(acf.gstin).trim().toUpperCase() : "";
  const supportHours = acf.support_hours ? decodeHtml(String(acf.support_hours)).trim() : "Mon-Sat, 9:00 AM - 6:00 PM IST";

  // Primary & Secondary Phone Swap
  const rawPrimary = acf.phone_primary ? String(acf.phone_primary).trim() : (process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+918107753647");
  const rawSecondary = acf.phone_secondary ? String(acf.phone_secondary).trim() : "";

  // Secondary becomes Primary, and Primary becomes Secondary
  const phonePrimary = rawSecondary || rawPrimary;
  const phoneSecondary = rawSecondary ? rawPrimary : "";
  const whatsappNumber = acf.whatsapp_number ? String(acf.whatsapp_number).replace(/[^0-9]/g, "") : (phonePrimary.replace(/[^0-9]/g, "") || "918107753647");
  const supportEmail = acf.support_email ? String(acf.support_email).trim() : "support@screwnet.in";
  const salesEmail = acf.sales_email ? String(acf.sales_email).trim() : "sales@screwnet.in";

  const addressLine1 = acf.address_line_1 ? decodeHtml(String(acf.address_line_1)).trim() : "2, Paneri Belda Road";
  const addressLine2 = acf.address_line_2 ? decodeHtml(String(acf.address_line_2)).trim() : "";
  const city = acf.city ? decodeHtml(String(acf.city)).trim() : "Udaipur";
  const state = acf.state ? decodeHtml(String(acf.state)).trim() : "Rajasthan";
  const postalCode = acf.postal_code ? String(acf.postal_code).trim() : "313001";
  const country = acf.country ? decodeHtml(String(acf.country)).trim() : "India";

  const fullAddress = [addressLine1, addressLine2, city, state, postalCode, country].filter(Boolean).join(", ");

  const latitude = parseFloat(acf.latitude) || 24.5854;
  const longitude = parseFloat(acf.longitude) || 73.7125;
  const googleMapsUrl = acf.google_maps_url ? String(acf.google_maps_url).trim() : "https://www.google.com/maps/search/?api=1&query=2+PANERI+BELDA+ROAD+UDAIPUR";
  const mapEmbedUrl = acf.map_embed_url ? String(acf.map_embed_url).trim() : `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=m&z=15&output=embed&iwloc=near`;

  const social = {
    instagram: acf.instagram_url ? String(acf.instagram_url).trim() : "",
    facebook: acf.facebook_url ? String(acf.facebook_url).trim() : "",
    linkedin: acf.linkedin_url ? String(acf.linkedin_url).trim() : "",
    youtube: acf.youtube_url ? String(acf.youtube_url).trim() : "",
    x: acf.x_url ? String(acf.x_url).trim() : "",
  };

  const policies = {
    privacy: acf.privacy_policy_url || "/pages/privacy-policy",
    terms: acf.terms_url || "/pages/terms-and-conditions",
    shipping: acf.shipping_policy_url || "/pages/shipping-policy",
    returns: acf.returns_policy_url || "/pages/refund-policy",
  };

  const footerNote = acf.footer_note ? decodeHtml(String(acf.footer_note)).trim() : "screwnet — India's Premier Online Industrial Fasteners & Screws Store";

  return {
    companyName,
    displayName,
    logoDark,
    logoLight,
    gstin,
    supportHours,
    phonePrimary,
    phoneSecondary,
    whatsappNumber,
    supportEmail,
    salesEmail,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    fullAddress,
    latitude,
    longitude,
    googleMapsUrl,
    mapEmbedUrl,
    social,
    policies,
    footerNote,
  };
}
