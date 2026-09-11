import { NextResponse } from "next/server";
import { WP_URL, getCategories, getProducts } from "@/lib/wp";

const publicSearchCache = {
  headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" },
};

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [], total: 0 });
  }
  if (query.length > 100) {
    return NextResponse.json({ error: "Search must be 100 characters or fewer." }, { status: 400 });
  }

  try {
    // 1. Primary Engine: FiboSearch - AJAX Search for WooCommerce
    const fiboResponse = await fetch(`${WP_URL}/wp-json/screwnet/v1/fibosearch?s=${encodeURIComponent(query)}`, {
      next: { revalidate: 300 },
    });

    if (fiboResponse.ok) {
      const data = await fiboResponse.json();
      if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        return NextResponse.json({
          suggestions: data.suggestions,
          total: data.total || data.suggestions.length,
          engine: "fibosearch",
        }, publicSearchCache);
      }
    }
  } catch (error) {
    console.error("FiboSearch fetch error:", error);
  }

  // 2. Fallback to native WooCommerce catalog search
  const [products, categories] = await Promise.all([
    getProducts({ search: query, per_page: "6" }, { hydrateVariations: false }).catch(() => []),
    getCategories({ search: query, per_page: "4", hide_empty: "true" }).catch(() => []),
  ]);

  const productSuggestions = products.map((product) => ({
    id: product.id,
    label: product.name,
    type: "product",
    sku: product.sku || "",
    price: product.price || "",
    href: `/product/${product.slug}`,
    image: product.images?.[0]?.thumbnail || product.images?.[0]?.src || "",
    engine: "wc_fallback",
  }));

  const categorySuggestions = categories.map((category) => ({
    id: category.id,
    label: category.name,
    type: "category",
    sku: "",
    price: "",
    href: `/category/${category.slug}`,
    image: category.image?.thumbnail || category.image?.src || "",
    count: category.count || 0,
    engine: "taxonomy_fallback",
  }));

  const combined = [...productSuggestions, ...categorySuggestions].slice(0, 10);
  return NextResponse.json({
    suggestions: combined,
    total: combined.length,
    engine: "wc_fallback",
  }, publicSearchCache);
}
