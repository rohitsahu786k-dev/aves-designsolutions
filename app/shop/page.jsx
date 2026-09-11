import { CollectionShell } from "@/components/collection-shell";
import { getCategories, getProductAttributes, getPaginatedProducts } from "@/lib/wp";
import { productQueryParams } from "@/lib/product-query";

export const metadata = {
  title: "Shop All Screws, Bolts & Fasteners | screwnet",
  description: "Browse certified industrial screws, self-drilling Tek screws, drywall screws, bolts, nuts and washers online from screwnet.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 30;

export default async function ShopPage({ searchParams }) {
  const query = await searchParams;
  const page = query?.page ? Number(query.page) : 1;
  const params = { per_page: "50", page: String(page), ...productQueryParams(query) };

  const [paginatedData, categories, attributes] = await Promise.all([
    getPaginatedProducts(params).catch(() => ({ products: [], total: 0, totalPages: 1, page: 1, perPage: 50 })),
    getCategories().catch(() => []),
    getProductAttributes().catch(() => []),
  ]);

  return (
    <CollectionShell
      title={query?.search ? `Search: "${query.search}"` : "All Screws & Fasteners"}
      description="Live warehouse catalog with full dimensional specs, instant stock verification, bulk box pricing and express dispatch."
      products={paginatedData.products}
      pagination={paginatedData}
      categories={categories}
      attributes={attributes}
      activeQuery={query}
    />
  );
}
