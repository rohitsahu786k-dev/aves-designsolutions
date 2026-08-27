import { ProductCard } from "@/components/product-card";

export function ProductGrid({ products }) {
  if (!products?.length) {
    return <p className="muted">No products found.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
