import { SCREWNET_BLOGS } from "@/lib/screwnet-blogs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://wp.screwnet.in";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

async function all(endpoint, perPage = 100, maxPages = 3) {
  const rows = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const join = endpoint.includes("?") ? "&" : "?";
    const response = await fetch(`${WP_URL}${endpoint}${join}per_page=${perPage}&page=${page}`, { next: { revalidate: 3600 } }).catch(() => null);
    if (!response?.ok) break;
    const batch = await response.json().catch(() => []);
    if (!Array.isArray(batch)) break;
    rows.push(...batch);
    if (batch.length < perPage) break;
  }
  return rows;
}

export default async function sitemap() {
  const [products, categories, wpPosts, pages] = await Promise.all([
    all("/wp-json/wc/store/v1/products"),
    all("/wp-json/wc/store/v1/products/categories"),
    all("/wp-json/wp/v2/posts?_fields=slug,modified_gmt"),
    all("/wp-json/wp/v2/pages?_fields=slug,modified_gmt"),
  ]);

  const staticRoutes = ["", "/shop", "/about", "/contact", "/blog", "/wishlist", "/cart"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const blogRoutes = SCREWNET_BLOGS.map((blog) => ({
    url: `${SITE_URL}/blog/${blog.slug}`,
    lastModified: `${blog.publishedAt}T09:00:00Z`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...products.map((item) => ({
      url: `${SITE_URL}/product/${item.slug}`,
      lastModified: item.date_modified_gmt || undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    ...categories
      .filter((item) => item.slug && item.count)
      .map((item) => ({
        url: `${SITE_URL}/category/${item.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      })),
    ...wpPosts.map((item) => ({
      url: `${SITE_URL}/blog/${item.slug}`,
      lastModified: item.modified_gmt || undefined,
      changeFrequency: "monthly",
      priority: 0.6,
    })),
    ...pages
      .filter((item) => item.slug && !["cart", "checkout", "my-account"].includes(item.slug))
      .map((item) => ({
        url: `${SITE_URL}/pages/${item.slug}`,
        lastModified: item.modified_gmt || undefined,
        changeFrequency: "monthly",
        priority: 0.5,
      })),
  ];
}
