import { CollectionShell } from "@/components/collection-shell";
import { getCategories, getCategory, getProductAttributes, getPaginatedProductsByCategory } from "@/lib/wp";
import { stripHtml } from "@/lib/utils";
import { productQueryParams } from "@/lib/product-query";

export const revalidate = 86400;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  return {
    title: category?.name ? `${category.name} | screwnet` : "Fastener Category | screwnet",
    description: stripHtml(category?.description || `Shop ${category?.name || "fasteners"} online at screwnet.`),
    alternates: { canonical: `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const page = query?.page ? Number(query.page) : 1;
  const [category, categories, attributes] = await Promise.all([
    getCategory(slug).catch(() => null),
    getCategories().catch(() => []),
    getProductAttributes().catch(() => []),
  ]);
  const productParams = { per_page: "50", page: String(page), ...productQueryParams(query) };
  const paginatedData = category
    ? await getPaginatedProductsByCategory(category.id, productParams).catch(() => ({ products: [], total: 0, totalPages: 1, page: 1, perPage: 50 }))
    : { products: [], total: 0, totalPages: 1, page: 1, perPage: 50 };

  return (
    <>
      <CollectionShell
        title={category?.name || "Category"}
        description={category?.description}
        products={paginatedData.products}
        pagination={paginatedData}
        categories={categories}
        attributes={attributes}
        basePath={`/category/${slug}`}
        activeQuery={query}
      />
      {category?.description ? (
        <section className="container section content" dangerouslySetInnerHTML={{ __html: category.description }} />
      ) : null}
    </>
  );
}
