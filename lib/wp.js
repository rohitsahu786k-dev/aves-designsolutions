import { cache } from "react";
import { decodeHtml } from "@/lib/utils";
import { normalizeAcfProduct } from "@/lib/acf-normalizer";
import { SCREWNET_BLOGS, getBlogBySlug } from "@/lib/screwnet-blogs";

export const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://wp.screwnet.in";

const envRevalidate = Number(process.env.NEXT_PUBLIC_REVALIDATE_SECONDS);
const revalidate = envRevalidate && envRevalidate >= 3600 ? envRevalidate : 86400;

async function wpFetchWithHeaders(path, options = {}) {
  const url = path.startsWith("http") ? path : `${WP_URL}${path}`;
  const { next, ...restOptions } = options;
  const cacheOptions = restOptions.cache === "no-store" ? {} : { next: { revalidate, ...(next || {}) } };
  const res = await fetch(url, {
    ...restOptions,
    ...cacheOptions,
  });

  if (!res.ok) {
    if (res.status === 404) return { data: null, total: 0, totalPages: 0 };
    throw new Error(`Storefront request failed: ${res.status} ${url}`);
  }

  const data = await res.json();

  const total = Number(res.headers.get("x-wp-total") || 0);
  const totalPages = Number(res.headers.get("x-wp-totalpages") || 1);

  return {
    data,
    total,
    totalPages,
  };
}

export async function wpFetch(path, options = {}) {
  const result = await wpFetchWithHeaders(path, options);
  return result.data;
}

export function wordpressUrl(path = "/") {
  return `${WP_URL}${path}`;
}

export async function getSiteInfo(options = {}) {
  return wpFetch("/wp-json/", options);
}

export async function getPaginatedProducts(params = {}, { hydrateVariations = true } = {}) {
  const page = Number(params.page || 1);
  const perPage = Number(params.per_page || 50);
  const query = new URLSearchParams({ per_page: String(perPage), page: String(page), ...params });

  try {
    const { data, total, totalPages } = await wpFetchWithHeaders(`/wp-json/wc/store/v1/products?${query}`);
    const list = Array.isArray(data) ? data : [];
    const products = hydrateVariations ? await hydrateProductList(list) : list;
    return {
      products: products.map((p) => stripProductInternals({ ...p, acf_fields: normalizeAcfProduct(p) })),
      total: total || products.length,
      totalPages: totalPages || Math.ceil((total || products.length) / perPage) || 1,
      page,
      perPage,
    };
  } catch (error) {
    console.error("Error fetching paginated products:", error);
    return {
      products: [],
      total: 0,
      totalPages: 1,
      page,
      perPage,
    };
  }
}

export async function getProducts(params = {}, options = {}) {
  const res = await getPaginatedProducts({ per_page: "50", ...params }, options);
  return res.products;
}

export const getProduct = cache(async function getProduct(slug) {
  const authHeaders = wooAuthHeaders();
  let liveImages = null;

  // 1. Fetch live WooCommerce v3 product gallery images if API credentials are configured
  if (authHeaders.Authorization) {
    try {
      const v3Res = await fetch(`${WP_URL}/wp-json/wc/v3/products?slug=${encodeURIComponent(slug)}`, {
        headers: authHeaders,
        next: { revalidate: 86400 },
      });
      if (v3Res.ok) {
        const v3Data = await v3Res.json();
        if (Array.isArray(v3Data) && v3Data[0]?.images) {
          liveImages = v3Data[0].images;
        }
      }
    } catch (err) {
      console.warn("Could not fetch wc/v3 live gallery images:", err);
    }
  }

  const [products, wpPosts] = await Promise.all([
    getProducts({ slug, per_page: "1" }, { next: { revalidate: 86400 } }),
    wpFetch(`/wp-json/wp/v2/product?slug=${encodeURIComponent(slug)}&_fields=id,slug,acf`, { next: { revalidate: 86400 } }).catch(() => []),
  ]);
  let product = products?.[0] || null;
  if (!product) return null;

  // 2. Merge fresh gallery images so admin updates reflect immediately on frontend
  if (Array.isArray(liveImages) && liveImages.length > 0) {
    product = {
      ...product,
      images: liveImages.map((img) => ({
        id: img.id,
        src: img.src,
        thumbnail: img.thumbnail || img.src,
        alt: img.alt || img.name || product.name,
      })),
    };
  }

  const wpAcf = Array.isArray(wpPosts) && wpPosts[0]?.acf ? wpPosts[0].acf : null;
  const acf_fields = normalizeAcfProduct(product, wpAcf || product.acf);

  const hydrated = (!product.id || !product.has_options) ? product : await hydrateProductVariations(product);
  return stripProductInternals({ ...hydrated, acf_fields });
});

function stripProductInternals(product) {
  if (!product || typeof product !== "object") return product;
  const rest = { ...product };
  delete rest.price_html;
  delete rest.add_to_cart;
  return {
    ...rest,
    variations: Array.isArray(rest.variations)
      ? rest.variations.map((variation) => {
          const cleanVariation = { ...(variation || {}) };
          delete cleanVariation.price_html;
          return cleanVariation;
        })
      : rest.variations,
  };
}

async function hydrateProductList(products = []) {
  const variableProducts = products.filter((product) => product?.id && product.has_options);
  if (!variableProducts.length) return products;

  const hydratedById = new Map();
  const concurrency = 6;
  for (let index = 0; index < variableProducts.length; index += concurrency) {
    const batch = variableProducts.slice(index, index + concurrency);
    const hydratedBatch = await Promise.all(batch.map((product) => hydrateProductVariations(product).catch(() => product)));
    hydratedBatch.forEach((product) => hydratedById.set(product.id, product));
  }

  return products.map((product) => hydratedById.get(product.id) || product);
}

export async function getProductById(id) {
  if (!id) return null;
  const product = await wpFetch(`/wp-json/wc/store/v1/products/${id}`).catch(() => null);
  if (!product) return null;
  const hydrated = (!product.id || !product.has_options) ? product : await hydrateProductVariations(product);
  return stripProductInternals({ ...hydrated, acf_fields: normalizeAcfProduct(hydrated) });
}

function wooAuthHeaders() {
  const username = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WP_APPLICATION_USERNAME;
  const password = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WP_APPLICATION_PASSWORD;
  if (!username || !password) return {};
  const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  return { Authorization: `Basic ${token}` };
}

function priceToMinor(value, minor = 2) {
  if (value === undefined || value === null || value === "") return "";
  return String(Math.round(Number(value) * Math.pow(10, minor)));
}

function normalizeVariationAttribute(attribute) {
  return {
    name: attribute.name,
    value: attribute.option || attribute.value || "",
    taxonomy: attribute.slug || "",
  };
}

const getProductVariationDetails = cache(async function getProductVariationDetails(productId) {
  const headers = wooAuthHeaders();
  if (!headers.Authorization) return [];
  const query = new URLSearchParams({ per_page: "100", status: "publish" });
  return wpFetch(`/wp-json/wc/v3/products/${productId}/variations?${query}`, { headers, next: { revalidate } }).catch(() => []);
});

async function hydrateProductVariations(product) {
  const details = await getProductVariationDetails(product.id);
  if (!Array.isArray(details) || !details.length) return product;

  const minor = product.prices?.currency_minor_unit ?? 2;
  const byId = new Map(details.map((variation) => [variation.id, variation]));
  const hydrated = (product.variations || []).map((variation) => {
    const detail = byId.get(variation.id);
    if (!detail) return variation;
    const price = priceToMinor(detail.price, minor);
    const regularPrice = priceToMinor(detail.regular_price || detail.price, minor);
    const salePrice = priceToMinor(detail.sale_price || detail.price, minor);
    return {
      ...variation,
      attributes: (detail.attributes?.length ? detail.attributes : variation.attributes || []).map(normalizeVariationAttribute),
      image: detail.image?.src ? { id: detail.image.id, src: detail.image.src, alt: detail.image.alt || product.name } : null,
      is_in_stock: detail.stock_status === "instock",
      stock_status: detail.stock_status,
      prices: {
        ...product.prices,
        price: price || product.prices?.price,
        regular_price: regularPrice || product.prices?.regular_price || product.prices?.price,
        sale_price: salePrice || price || product.prices?.sale_price || product.prices?.price,
      },
    };
  });

  return { ...product, variations: hydrated };
}

export async function getPopularProducts(params = {}) {
  return getProducts({ per_page: "16", orderby: "popularity", ...params }).catch(() => []);
}

export async function getRelatedProducts(productId) {
  const related = await wpFetch(`/wp-json/wc/store/v1/products?related=${productId}&per_page=8`).catch(() => []);
  return Array.isArray(related) ? related.map(stripProductInternals) : [];
}

export const getCategories = cache(async function getCategories(params = {}) {
  const query = new URLSearchParams({ per_page: "100", hide_empty: "false", ...params });
  const categories = await wpFetch(`/wp-json/wc/store/v1/products/categories?${query}`, { next: { revalidate: 86400 } });
  return Array.isArray(categories) ? categories.map(normalizeCategoryImage) : [];
});

function normalizeCategoryImage(category) {
  if (!category || typeof category !== "object") return category;
  const image = category.image;
  if (!image) return category;
  if (typeof image === "string") {
    return { ...category, image: { src: image, alt: category.name || "" } };
  }
  const src = image.src || image.thumbnail || image.full || image.url || "";
  return {
    ...category,
    image: src
      ? {
          ...image,
          src,
          alt: image.alt || category.name || "",
        }
      : image,
  };
}

export const getProductAttributes = cache(async function getProductAttributes() {
  const attributes = await wpFetch("/wp-json/wc/store/v1/products/attributes", { next: { revalidate: 1800 } }).catch(() => []);
  return Promise.all(
    attributes.map(async (attribute) => ({
      ...attribute,
      terms: await wpFetch(`/wp-json/wc/store/v1/products/attributes/${attribute.id}/terms?per_page=100`, { next: { revalidate: 1800 } }).catch(() => []),
    }))
  );
});

export async function getCategory(slug) {
  if (!slug) return null;
  const normalizedSlug = decodeURIComponent(String(slug)).trim().toLowerCase();
  const categories = await getCategories({ per_page: "100", hide_empty: "false" }).catch(() => []);
  return categories.find((category) => String(category.slug || "").toLowerCase() === normalizedSlug) || null;
}

export async function getPaginatedProductsByCategory(categoryIdOrSlug, params = {}) {
  if (!categoryIdOrSlug) return { products: [], total: 0, totalPages: 1, page: 1, perPage: 50 };
  return getPaginatedProducts({ category: String(categoryIdOrSlug), per_page: "50", ...params });
}

export async function getProductsByCategory(categoryIdOrSlug, params = {}) {
  const res = await getPaginatedProductsByCategory(categoryIdOrSlug, params);
  return res.products;
}

export async function getPages(params = {}) {
  const query = new URLSearchParams({
    per_page: "30",
    _fields: "id,slug,title,content,link,yoast_head_json,featured_media",
    ...params,
  });
  return wpFetch(`/wp-json/wp/v2/pages?${query}`);
}

export async function getPageById(id, options = {}) {
  if (!id) return null;
  return wpFetch(`/wp-json/wp/v2/pages/${id}?_fields=id,slug,title,content,link,yoast_head_json,acf`, options).catch(() => null);
}

export async function getPage(slug) {
  const pages = await getPages({ slug, per_page: "1" });
  return pages?.[0] || null;
}

export async function getFrontPage(options = {}) {
  const site = await getSiteInfo(options).catch(() => null);
  const page = site?.page_on_front ? await getPageById(site.page_on_front, options).catch(() => null) : null;
  return page || getPage("home").catch(() => null);
}

function mapScrewnetBlogToWpPost(blog) {
  return {
    id: blog.id,
    slug: blog.slug,
    date: `${blog.publishedAt}T09:00:00`,
    title: { rendered: blog.title },
    excerpt: { rendered: `<p>${blog.excerpt}</p>` },
    content: { rendered: blog.content },
    category: blog.category,
    tags: blog.tags,
    readTime: blog.readTime,
    authorName: blog.author,
    _embedded: {
      "wp:featuredmedia": [
        {
          source_url: blog.featuredImage,
          alt_text: blog.title,
        },
      ],
    },
    yoast_head_json: {
      title: blog.seo.metaTitle,
      description: blog.seo.metaDescription,
      og_title: blog.seo.metaTitle,
      og_description: blog.seo.metaDescription,
      og_image: [{ url: blog.featuredImage }],
      robots: { index: "index", follow: "follow" },
    },
  };
}

export async function getPostCategories(params = {}) {
  const query = new URLSearchParams({ per_page: "100", hide_empty: "false", ...params });
  const wpCats = await wpFetch(`/wp-json/wp/v2/categories?${query}`, { next: { revalidate: 86400, tags: ["categories"] } }).catch(() => []);
  if (Array.isArray(wpCats) && wpCats.length > 0) {
    return wpCats.filter((c) => c.slug !== "uncategorized" && Number(c.count) > 0);
  }
  return [];
}

export async function getPosts(params = {}) {
  const queryParams = { per_page: "100", _embed: "1", ...params };
  const query = new URLSearchParams(queryParams);
  const wpPosts = await wpFetch(`/wp-json/wp/v2/posts?${query}`, { next: { revalidate: 86400, tags: ["posts"] } }).catch(() => []);
  if (Array.isArray(wpPosts) && wpPosts.length > 0) {
    return wpPosts;
  }
  const customPosts = SCREWNET_BLOGS.map(mapScrewnetBlogToWpPost);
  return customPosts;
}

export async function getPost(slug) {
  if (!slug) return null;
  const wpPosts = await wpFetch(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`, { next: { revalidate: 86400, tags: ["posts", `post-${slug}`] } }).catch(() => []);
  if (Array.isArray(wpPosts) && wpPosts.length > 0 && wpPosts[0]) {
    return wpPosts[0];
  }
  const local = getBlogBySlug(slug);
  return local ? mapScrewnetBlogToWpPost(local) : null;
}



export async function getRankMathHead(url) {
  if (!url) return null;
  return wpFetch(`/wp-json/rankmath/v1/getHead?url=${encodeURIComponent(url)}`).catch(() => null);
}

export async function getYoastHead(url) {
  if (!url) return null;
  return wpFetch(`/wp-json/yoast/v1/get_head?url=${encodeURIComponent(url)}`).catch(() => null);
}

export async function getSeoHead(url) {
  if (!url) return null;
  const rankmath = await getRankMathHead(url);
  if (rankmath?.head) return rankmath.head;
  const yoast = await getYoastHead(url);
  if (yoast?.json || yoast?.html) return yoast;
  return null;
}

export async function getMedia(search = "banner") {
  const query = new URLSearchParams({
    per_page: "12",
    search,
    _fields: "id,source_url,alt_text,title,caption,media_details",
  });
  return wpFetch(`/wp-json/wp/v2/media?${query}`).catch(() => []);
}

export async function getMediaById(id) {
  if (!id) return null;
  return wpFetch(`/wp-json/wp/v2/media/${id}`).catch(() => null);
}

export async function getHomeBanners(products = []) {
  const media = await getMedia("slide").catch(() => []);
  const usableMedia = media.filter((item) => item.source_url);
  if (usableMedia.length) {
    return usableMedia.slice(0, 4).map((item, index) => ({
      title: decodeHtml(item.title?.rendered || ["Industrial Fasteners", "Precision Self-Drilling Screws", "High Tensile Bolts & Nuts", "Stainless Steel Fasteners"][index] || "Screwnet"),
      text: decodeHtml(item.caption?.rendered?.replace(/<[^>]*>/g, "") || "India's premier online store for industrial screws, bolts, nuts and fasteners."),
      image: item.source_url,
      href: "/shop",
    }));
  }

  return [
    {
      title: "India's Premier Industrial Screws & Fasteners Store",
      text: "Shop high-tensile bolts, self-drilling Tek screws, drywall screws, nuts, washers and stainless steel hardware with live stock.",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80",
      href: "/shop",
    },
    {
      title: "Self-Drilling & Drywall Screws",
      text: "High-grade hardened carbon steel and stainless steel screws engineered for metal, drywall and heavy timber framing.",
      image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1400&q=80",
      href: "/shop",
    },
    {
      title: "Grade 8.8, 10.9 & 12.9 High Tensile Fasteners",
      text: "Socket head Allen screws, hex bolts, anchor fasteners and locking nuts with nationwide B2B & B2C express shipping.",
      image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1400&q=80",
      href: "/shop",
    },
  ];
}

export async function getInstagramFeed(limit = 8) {
  return [];
}

export function getModernBlogBanner(post) {
  const slug = (post?.slug || post?.title?.rendered || "").toLowerCase();
  
  if (slug.includes("bulk") || slug.includes("b2b")) {
    return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("sheet-metal") || slug.includes("fabrication") || slug.includes("oxide")) {
    return "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("electronic") || slug.includes("m2-m3-m4")) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("corrosive") || slug.includes("outdoor") || slug.includes("316") || slug.includes("marine")) {
    return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("torque")) {
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("loosening") || slug.includes("nyloc") || slug.includes("lock")) {
    return "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("measure") || slug.includes("pitch") || slug.includes("gauge")) {
    return "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("grade") || slug.includes("8-8") || slug.includes("hex-bolt")) {
    return "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("eye-bolt") || slug.includes("lifting")) {
    return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("torx") || slug.includes("countersunk") || slug.includes("drywall") || slug.includes("wood")) {
    return "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("socket") || slug.includes("allen") || slug.includes("grub")) {
    return "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("dome") || slug.includes("architectural")) {
    return "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80";
  }
  if (slug.includes("flanged") || slug.includes("washer") || slug.includes("cheese")) {
    return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80";
  }

  return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80";
}

export function getFeaturedImage(post) {
  const wpMediaUrl = post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url || post?.featured_media_src_url || post?.featuredImage;
  if (wpMediaUrl) {
    return wpMediaUrl;
  }
  return getModernBlogBanner(post);
}

export function getPostCategoryName(post) {
  if (post?.category) return post.category;
  const terms = post?._embedded?.["wp:term"] || [];
  const categories = terms.flat().filter((term) => term?.taxonomy === "category");
  return categories[0]?.name || "Blog";
}

export function getPostReadTime(post) {
  if (post?.readTime) return post.readTime;
  const text = `${post?.content?.rendered || ""} ${post?.excerpt?.rendered || ""}`.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

export function getTopCategoriesFromProducts(products = [], limit = 4) {
  const map = new Map();
  products.forEach((product) => {
    product.categories?.forEach((category) => {
      const current = map.get(category.slug) || { ...category, count: 0, image: product.images?.[0]?.src };
      current.count += 1;
      if (!current.image) current.image = product.images?.[0]?.src;
      map.set(category.slug, current);
    });
  });
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
