import { decodeHtml } from "@/lib/utils";
import { normalizeAcfProduct } from "@/lib/acf-normalizer";
import { SCREWNET_BLOGS, getBlogBySlug } from "@/lib/screwnet-blogs";

export const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://slateblue-frog-836232.hostingersite.com";

const revalidate = Number(process.env.NEXT_PUBLIC_REVALIDATE_SECONDS || 60);

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
    throw new Error(`WordPress request failed: ${res.status} ${url}`);
  }

  const data = await res.json();
  const serialized = JSON.stringify(data);

  const total = Number(res.headers.get("x-wp-total") || 0);
  const totalPages = Number(res.headers.get("x-wp-totalpages") || 1);

  return {
    data: JSON.parse(serialized),
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

export async function getPaginatedProducts(params = {}) {
  const page = Number(params.page || 1);
  const perPage = Number(params.per_page || 50);
  const query = new URLSearchParams({ per_page: String(perPage), page: String(page), ...params });

  try {
    const { data, total, totalPages } = await wpFetchWithHeaders(`/wp-json/wc/store/v1/products?${query}`);
    const products = await hydrateProductList(Array.isArray(data) ? data : []);
    return {
      products: products.map((p) => ({ ...p, acf_fields: normalizeAcfProduct(p) })),
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

export async function getProducts(params = {}) {
  const res = await getPaginatedProducts({ per_page: "50", ...params });
  return res.products;
}

export async function getProduct(slug) {
  const [products, wpPosts] = await Promise.all([
    getProducts({ slug, per_page: "1" }),
    wpFetch(`/wp-json/wp/v2/product?slug=${encodeURIComponent(slug)}&_fields=id,slug,acf`).catch(() => []),
  ]);
  const product = products?.[0] || null;
  if (!product) return null;

  const wpAcf = Array.isArray(wpPosts) && wpPosts[0]?.acf ? wpPosts[0].acf : null;
  const acf_fields = normalizeAcfProduct(product, wpAcf || product.acf);

  const hydrated = (!product.id || !product.has_options) ? product : await hydrateProductVariations(product);
  return { ...hydrated, acf_fields };
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
  return { ...hydrated, acf_fields: normalizeAcfProduct(hydrated) };
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

async function getProductVariationDetails(productId) {
  const headers = wooAuthHeaders();
  if (!headers.Authorization) return [];
  const query = new URLSearchParams({ per_page: "100", status: "publish" });
  return wpFetch(`/wp-json/wc/v3/products/${productId}/variations?${query}`, { headers, next: { revalidate } }).catch(() => []);
}

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
  return wpFetch(`/wp-json/wc/store/v1/products?related=${productId}&per_page=8`).catch(() => []);
}

export async function getCategories(params = {}) {
  const query = new URLSearchParams({ per_page: "60", hide_empty: "true", ...params });
  return wpFetch(`/wp-json/wc/store/v1/products/categories?${query}`);
}

export async function getProductAttributes() {
  const attributes = await wpFetch("/wp-json/wc/store/v1/products/attributes").catch(() => []);
  return Promise.all(
    attributes.map(async (attribute) => ({
      ...attribute,
      terms: await wpFetch(`/wp-json/wc/store/v1/products/attributes/${attribute.id}/terms?per_page=100`).catch(() => []),
    }))
  );
}

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

export async function getPosts(params = {}) {
  const query = new URLSearchParams({ per_page: "12", _embed: "1", ...params });
  const wpPosts = await wpFetch(`/wp-json/wp/v2/posts?${query}`).catch(() => []);
  const customPosts = SCREWNET_BLOGS.map(mapScrewnetBlogToWpPost);
  if (Array.isArray(wpPosts) && wpPosts.length > 0) {
    return wpPosts;
  }
  return customPosts;
}

export async function getPost(slug) {
  if (!slug) return null;
  const wpPost = await wpFetch(`/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`).catch(() => []);
  if (wpPost?.[0]) return wpPost[0];
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

export function getFeaturedImage(post) {
  return post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url || post?.featuredImage;
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
