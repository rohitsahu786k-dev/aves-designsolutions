import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, Headphones, Truck, Wrench } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { WpImage } from "@/components/wp-image";
import { decodeHtml } from "@/lib/utils";

export function HomeCatalogHero({ products = [], categories = [] }) {
  const featuredProducts = products.slice(0, 4);
  const featuredCategories = categories.filter((category) => category.count > 0 && category.slug !== "uncategorized").slice(0, 6);
  const heroProduct = featuredProducts[0];
  const heroImage = heroProduct?.images?.[0];

  return (
    <section className="home-catalog-hero" aria-label="screwnet product catalog">
      <div className="container home-catalog-hero-grid">
        <div className="home-catalog-copy">
          <div className="home-catalog-kicker">
            <BadgeCheck size={15} />
            <span>DIN / ISO verified industrial fasteners</span>
          </div>
          <h1>Industrial screws, bolts and anchors ready for dispatch.</h1>
          <p>
            Shop live WooCommerce stock by head style, material grade, finish and pack size. Built for contractors,
            fabricators, OEM teams and maintenance buyers.
          </p>

          <div className="home-catalog-actions">
            <Link href="/shop" className="button home-primary-cta">
              Shop Catalog <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="home-secondary-cta">
              Bulk RFQ Desk
            </Link>
          </div>

          <div className="home-trust-row" aria-label="Store advantages">
            <span><Truck size={15} /> 24-48h dispatch</span>
            <span><Boxes size={15} /> Carton pricing</span>
            <span><Headphones size={15} /> Technical support</span>
          </div>
        </div>

        <div className="home-hero-product-stage">
          <Link href={heroProduct ? `/product/${heroProduct.slug}` : "/shop"} className="home-featured-product">
            <span className="home-featured-label">Featured Stock</span>
            <div className="home-featured-image">
              <WpImage src={heroImage?.src || heroImage?.thumbnail} alt={heroImage?.alt || heroProduct?.name || "Featured industrial fastener"} />
            </div>
            <div className="home-featured-copy">
              <strong>{decodeHtml(heroProduct?.name || "Browse live fastener inventory")}</strong>
              <small>View specs, variants and pack pricing</small>
            </div>
          </Link>

          <div className="home-category-panel">
            <div className="home-panel-heading">
              <Wrench size={16} />
              <span>Shop by category</span>
            </div>
            <div className="home-category-links">
              {featuredCategories.map((category) => (
                <Link href={`/category/${category.slug}`} key={category.id}>
                  <span>{decodeHtml(category.name)}</span>
                  <small>{category.count}</small>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {featuredProducts.length ? (
        <div className="container home-quick-products">
          <div className="home-strip-heading">
            <span>Fast moving stock</span>
            <Link href="/shop?orderby=popularity">View all</Link>
          </div>
          <div className="home-quick-product-grid">
            {featuredProducts.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
