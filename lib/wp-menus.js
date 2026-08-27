import { WP_URL } from "@/lib/wp";

function authHeaders() {
  const username = process.env.WP_APPLICATION_USERNAME;
  const password = process.env.WP_APPLICATION_PASSWORD;
  if (!username || !password) return {};
  return { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` };
}

async function menuFetch(path) {
  const response = await fetch(`${WP_URL}${path}`, {
    headers: authHeaders(),
    next: { revalidate: 300 },
  });
  if (!response.ok) return [];
  return response.json();
}

function localHref(url = "") {
  if (!url) return "/";
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(WP_URL).origin) return url;
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (parsed.pathname.startsWith("/product-category/")) {
      return `/category/${pathParts.at(-1)}`;
    }
    if (parsed.pathname.startsWith("/product/")) {
      return parsed.pathname.replace("/product/", "/product/").replace(/\/$/, "");
    }
    if (["cart", "checkout", "my-account"].includes(pathParts[0])) return url;
    if (pathParts[0] === "all-products") return "/shop";
    const knownRoutes = new Set(["", "shop", "blog", "about", "contact", "wishlist"]);
    if (knownRoutes.has(pathParts[0] || "")) return `${parsed.pathname}${parsed.search}` || "/";
    if (pathParts.length === 1) return `/pages/${pathParts[0]}`;
    return url;
  } catch {
    return url;
  }
}

export async function getPrimaryMenu() {
  const menus = await menuFetch("/wp-json/wp/v2/menus?per_page=100");
  const primary = menus.find((menu) => /main|primary|header/i.test(`${menu.name} ${menu.slug}`))
    || menus.find((menu) => menu.locations?.some((location) => /menu-1|primary|header|main/i.test(location)))
    || menus[0];
  if (!primary?.id) return [];

  const items = await menuFetch(`/wp-json/wp/v2/menu-items?per_page=100&menus=${primary.id}&orderby=menu_order&order=asc`);
  return items
    .filter((item) => item.status === "publish")
    .map((item) => ({
      id: item.id,
      label: item.title?.rendered || "Menu item",
      href: localHref(item.url),
      parent: item.parent || 0,
      order: item.menu_order || 0,
    }));
}
