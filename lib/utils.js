import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function stripHtml(value = "") {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function decodeHtml(value = "") {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8242;/g, "'")
    .replace(/&#8243;/g, '"');
}

export function cleanDescriptionHtml(html = "") {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<figure[^>]*class="[^"]*wp-block-gallery[^"]*"[^>]*>[\s\S]*?<\/figure>/gi, "")
    .replace(/<div[^>]*class="[^"]*gallery[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<ul[^>]*class="[^"]*wp-block-gallery[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, "")
    .replace(/<figure[^>]*>[\s\S]*?<img[\s\S]*?<\/figure>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .trim();
}


export function formatPrice(prices) {
  if (!prices?.price) return "";
  const amount = Number(prices.price) / Math.pow(10, prices.currency_minor_unit ?? 2);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: prices.currency_code || "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function yoastToMetadata(seoData, fallback = {}) {
  if (!seoData) return fallback;

  // Handle Rank Math HTML string or structured JSON head
  if (typeof seoData === "string") {
    const titleMatch = seoData.match(/<title>([^<]+)<\/title>/i);
    const descMatch = seoData.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogTitleMatch = seoData.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = seoData.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = seoData.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

    const title = titleMatch?.[1] || fallback.title || "screwnet";
    const description = descMatch?.[1] || fallback.description || "India's premier store for industrial screws, bolts, fasteners and hardware.";

    return {
      title: decodeHtml(title),
      description: decodeHtml(description),
      openGraph: {
        title: decodeHtml(ogTitleMatch?.[1] || title),
        description: decodeHtml(ogDescMatch?.[1] || description),
        siteName: "screwnet",
        images: ogImageMatch?.[1] ? [{ url: ogImageMatch[1] }] : [],
        type: "website",
      },
    };
  }

  // Handle Yoast / Rank Math JSON object
  const head = seoData.json || seoData;
  return {
    title: decodeHtml(head.title || fallback.title || "screwnet"),
    description: head.description || fallback.description || "India's premier store for industrial screws, bolts, fasteners and hardware.",
    alternates: head.canonical ? { canonical: head.canonical } : undefined,
    openGraph: {
      title: decodeHtml(head.og_title || head.title || fallback.title || "screwnet"),
      description: head.og_description || head.description || fallback.description || "Industrial fasteners and screws from screwnet.",
      url: head.og_url,
      siteName: head.og_site_name || "screwnet",
      images: head.og_image?.map((image) => ({ url: typeof image === "string" ? image : image.url })) || [],
      type: head.og_type || "website",
    },
    twitter: {
      card: head.twitter_card || "summary_large_image",
      title: decodeHtml(head.twitter_title || head.title || fallback.title || ""),
      description: head.twitter_description || head.description || fallback.description || "",
    },
    robots: head.robots
      ? {
          index: head.robots.index !== "noindex",
          follow: head.robots.follow !== "nofollow",
        }
      : undefined,
  };
}

export function extractContactDetails(html = "") {
  const text = stripHtml(html);
  const phones = [...new Set(text.match(/\+91\d{10}/g) || [])];
  const emails = [...new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
  return {
    phones,
    emails,
    location: /Udaipur/i.test(html) ? "Udaipur, Rajasthan" : "India",
  };
}

export const FASTENER_FINISH_MAP = {
  // Industrial Fastener Finishes & Coatings - Pure Monochrome / Metallic System
  "natural-stainless": { background: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Natural Stainless" },
  "stainless-steel": { background: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Stainless Steel" },
  "ss-304": { background: "linear-gradient(135deg, #ffffff 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "SS 304" },
  "ss-316": { background: "linear-gradient(135deg, #f4f4f5 0%, #a1a1aa 50%, #52525b 100%)", border: "#52525b", textColor: "#000000", label: "SS 316 (Marine)" },
  "bright-zinc": { background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 50%, #e4e4e7 100%)", border: "#a1a1aa", textColor: "#000000", label: "Bright Zinc" },
  "zinc-plated": { background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 50%, #e4e4e7 100%)", border: "#a1a1aa", textColor: "#000000", label: "Zinc Plated" },
  "white-zinc": { background: "linear-gradient(135deg, #ffffff 0%, #fafafa 50%, #f4f4f5 100%)", border: "#d4d4d8", textColor: "#000000", label: "White Zinc" },
  "yellow-zinc": { background: "linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Yellow Zinc" },
  "yellow-passivated": { background: "linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Yellow Passivated" },
  "zinc-bichromate": { background: "linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Zinc Bichromate" },
  "black-oxide": { background: "linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)", border: "#000000", textColor: "#ffffff", label: "Black Oxide" },
  "chemical-black": { background: "linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)", border: "#000000", textColor: "#ffffff", label: "Chemical Black" },
  "black-phosphate": { background: "linear-gradient(135deg, #3f3f46 0%, #27272a 50%, #18181b 100%)", border: "#18181b", textColor: "#ffffff", label: "Black Phosphate" },
  "black-zinc": { background: "linear-gradient(135deg, #3f3f46 0%, #18181b 50%, #000000 100%)", border: "#000000", textColor: "#ffffff", label: "Black Zinc" },
  "galvanized": { background: "linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 50%, #71717a 100%)", border: "#71717a", textColor: "#000000", label: "Hot Dip Galvanized" },
  "hot-dip-galvanized": { background: "linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 50%, #71717a 100%)", border: "#71717a", textColor: "#000000", label: "Hot Dip Galvanized" },
  "hdg": { background: "linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 50%, #71717a 100%)", border: "#71717a", textColor: "#000000", label: "HDG" },
  "nickel-plated": { background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 50%, #d4d4d8 100%)", border: "#a1a1aa", textColor: "#000000", label: "Nickel Plated" },
  "nickel": { background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 50%, #d4d4d8 100%)", border: "#a1a1aa", textColor: "#000000", label: "Nickel" },
  "chrome": { background: "linear-gradient(135deg, #ffffff 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Chrome" },
  "chrome-plated": { background: "linear-gradient(135deg, #ffffff 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Chrome Plated" },
  "brass": { background: "linear-gradient(135deg, #fafafa 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Brass" },
  "pure-brass": { background: "linear-gradient(135deg, #fafafa 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#71717a", textColor: "#000000", label: "Pure Brass" },
  "copper": { background: "linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 50%, #71717a 100%)", border: "#71717a", textColor: "#000000", label: "Copper" },
  "copper-plated": { background: "linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 50%, #71717a 100%)", border: "#71717a", textColor: "#000000", label: "Copper Plated" },
  "carbon-steel": { background: "linear-gradient(135deg, #71717a 0%, #52525b 50%, #27272a 100%)", border: "#18181b", textColor: "#ffffff", label: "Carbon Steel" },
  "high-tensile": { background: "linear-gradient(135deg, #52525b 0%, #27272a 50%, #18181b 100%)", border: "#000000", textColor: "#ffffff", label: "High Tensile Steel" },
  "dacromet": { background: "linear-gradient(135deg, #d4d4d8 0%, #a1a1aa 50%, #71717a 100%)", border: "#71717a", textColor: "#000000", label: "Dacromet" },
  "geomet": { background: "linear-gradient(135deg, #d4d4d8 0%, #a1a1aa 50%, #71717a 100%)", border: "#71717a", textColor: "#000000", label: "Geomet" },
  "plain": { background: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#a1a1aa", textColor: "#000000", label: "Plain / Natural" },
  "natural": { background: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 50%, #a1a1aa 100%)", border: "#a1a1aa", textColor: "#000000", label: "Natural" },
};

export const COLOR_SWATCH_MAP = {
  ...FASTENER_FINISH_MAP,
  gold: { background: "linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 50%, #71717a 100%)", border: "#71717a", textColor: "#000000" },
  silver: { background: "linear-gradient(135deg, #FFFFFF 0%, #D8D8D8 50%, #9E9E9E 100%)", border: "#A0A0A0", textColor: "#000000" },
  bronze: { background: "linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 50%, #52525b 100%)", border: "#52525b", textColor: "#ffffff" },
  black: { background: "#000000", border: "#27272a", textColor: "#ffffff" },
  white: { background: "#ffffff", border: "#e4e4e7", textColor: "#000000" },
  grey: { background: "#71717a", border: "#3f3f46", textColor: "#ffffff" },
  gray: { background: "#71717a", border: "#3f3f46", textColor: "#ffffff" },
  zinc: { background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 50%, #e4e4e7 100%)", border: "#a1a1aa", textColor: "#000000" },
};

function stringToHslColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const l = 30 + (Math.abs(hash) % 40);
  return {
    background: `hsl(0, 0%, ${l}%)`,
    border: `hsl(0, 0%, ${Math.max(10, l - 15)}%)`,
    textColor: l > 55 ? "#000000" : "#ffffff",
  };
}

export function getColorSwatch(slugOrName = "") {
  if (!slugOrName) return null;
  const clean = String(slugOrName).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (FASTENER_FINISH_MAP[clean]) return FASTENER_FINISH_MAP[clean];
  if (COLOR_SWATCH_MAP[clean]) return COLOR_SWATCH_MAP[clean];
  
  const spaced = clean.replace(/-/g, " ");
  if (FASTENER_FINISH_MAP[spaced]) return FASTENER_FINISH_MAP[spaced];
  if (COLOR_SWATCH_MAP[spaced]) return COLOR_SWATCH_MAP[spaced];

  for (const [k, v] of Object.entries(COLOR_SWATCH_MAP)) {
    if (k.length > 2 && (clean.includes(k) || k.includes(clean))) {
      return v;
    }
  }

  return stringToHslColor(clean);
}

export function isFinishAttribute(nameOrTaxonomy = "") {
  const norm = String(nameOrTaxonomy).toLowerCase().trim();
  return (
    norm === "finish" ||
    norm === "pa_finish" ||
    norm.includes("finish") ||
    norm.includes("coating") ||
    norm === "color" ||
    norm === "pa_color" ||
    norm.includes("color") ||
    norm === "colour" ||
    norm === "pa_colour" ||
    norm.includes("colour")
  );
}

export function isColorAttribute(nameOrTaxonomy = "") {
  return isFinishAttribute(nameOrTaxonomy);
}

export function formatAttributeLabel(nameOrTaxonomy = "") {
  const norm = String(nameOrTaxonomy).toLowerCase().trim().replace(/^pa_/, "");
  if (norm.includes("finish") || norm.includes("color") || norm.includes("colour") || norm.includes("coating")) {
    return "Finish / Coating";
  }
  if (norm === "diameter" || norm === "thread-size" || norm.includes("diameter") || norm.includes("thread_size")) {
    return "Thread Size / Diameter";
  }
  if (norm === "length" || norm.includes("length")) {
    return "Length";
  }
  if (norm === "material" || norm.includes("material")) {
    return "Material";
  }
  if (norm === "head-style" || norm === "head_style" || norm.includes("head")) {
    return "Head Style";
  }
  if (norm === "drive-style" || norm === "drive_style" || norm.includes("drive")) {
    return "Drive Style";
  }
  if (norm === "pitch" || norm.includes("pitch")) {
    return "Thread Pitch";
  }
  if (norm === "grade" || norm.includes("grade") || norm.includes("strength")) {
    return "Strength Grade";
  }
  if (norm === "standard" || norm.includes("standard")) {
    return "Standard";
  }
  if (norm === "pack-size" || norm === "pack_size" || norm.includes("pack")) {
    return "Pack Size";
  }
  return decodeHtml(nameOrTaxonomy.replace(/^pa_/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
}
