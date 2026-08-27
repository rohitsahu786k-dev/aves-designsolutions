import Link from "next/link";
import { ArrowLeft, ChevronRight, HelpCircle, MapPin, PackageCheck, ShieldCheck, Sparkles, Star, Tag, Truck, Wrench } from "lucide-react";
import { ProductGrid } from "@/components/product-grid";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { ProductGallery } from "@/components/product-gallery";
import { ProductReviews } from "@/components/product-reviews";
import { StickyBuyBar } from "@/components/sticky-buy-bar";
import { SpecificationTable } from "@/components/pdp/specification-table";
import { ComplianceSection } from "@/components/pdp/compliance-section";
import { TechnicalDownloads } from "@/components/pdp/technical-downloads";
import { ApplicationsSection } from "@/components/pdp/applications-section";
import { ProfessionalPdpSections } from "@/components/pdp/professional-sections";
import { getProduct, getRelatedProducts, getSeoHead } from "@/lib/wp";
import { cleanDescriptionHtml, decodeHtml, formatPrice, stripHtml, yoastToMetadata } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const seoHead = product?.permalink ? await getSeoHead(product.permalink) : null;
  const metadata = yoastToMetadata(seoHead, {
    title: decodeHtml(product?.name ? `${product.name} | screwnet Fasteners` : "Fastener Product | screwnet"),
    description: stripHtml(product?.short_description || product?.description || "Precision industrial screws, bolts, and fasteners from screwnet."),
  });
  const canonical = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/product/${slug}`;
  return { ...metadata, alternates: { canonical }, openGraph: { ...metadata.openGraph, url: canonical } };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return (
      <div className="container page-hero">
        <div className="product-not-found-card">
          <h1>Product Not Found</h1>
          <p>The fastener product you are looking for might have been moved or updated.</p>
          <Link href="/shop" className="button">
            <ArrowLeft size={16} /> Return to Store Catalog
          </Link>
        </div>
      </div>
    );
  }

  const acf = product.acf_fields || {};
  const related = await getRelatedProducts(product.id);
  const imageMap = new Map();
  [...(product.images || []), ...(product.variations || []).map((variation) => variation.image).filter(Boolean)].forEach((image) => {
    const key = image.id || image.src;
    if (key && !imageMap.has(key)) imageMap.set(key, image);
  });
  const images = [...imageMap.values()];

  const minor = product.prices?.currency_minor_unit ?? 2;
  const priceNum = Number(product.prices?.price || 0) / Math.pow(10, minor);

  const productTitle = decodeHtml(product.name);
  const categoryTitle = decodeHtml(product.categories?.[0]?.name || "Fasteners");
  const categorySlug = product.categories?.[0]?.slug || "shop";

  const productUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/product/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productTitle,
    image: images.map((image) => image.src),
    description: stripHtml(product.short_description || product.description),
    sku: product.sku || String(product.id),
    mpn: acf.mpn || undefined,
    brand: {
      "@type": "Brand",
      name: "screwnet",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.prices?.currency_code || "INR",
      price: priceNum,
      availability: product.is_in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="container product-page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll("<", "\\u003c") }} />

      {/* A. Minimal Breadcrumb Navigation */}
      <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <Link href="/shop">Fasteners</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <Link href={`/category/${categorySlug}`}>{categoryTitle}</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span className="current-crumb">{productTitle}</span>
      </nav>

      {/* B. Above-the-fold 54/46 Layout: Media Gallery + Sticky Purchase Information */}
      <section className="product-detail luxury-pdp-layout">
        <ProductGallery
          images={images}
          dimensionDrawing={acf.dimensionDrawing}
          name={productTitle}
          productId={product.id}
        />

        <aside className="product-summary">
          <div className="pdp-category-strip">
            <Link href={`/category/${categorySlug}`} className="pdp-cat-link">
              {categoryTitle}
            </Link>
            {Number(product.average_rating) > 0 ? (
              <div className="pdp-rating-pill">
                <Star size={13} className="fill-black text-black" />
                <span>{Number(product.average_rating).toFixed(1)} ({product.review_count} Review{product.review_count !== 1 ? "s" : ""})</span>
              </div>
            ) : null}
          </div>

          <h1 className="pdp-main-title">{productTitle}</h1>

          {product.short_description ? (
            <div
              className="content pdp-intro-text"
              dangerouslySetInnerHTML={{ __html: cleanDescriptionHtml(product.short_description) }}
            />
          ) : null}

          {/* Interactive Purchase Panel (Pills, Swatches, MOQ, Add to Cart, Bulk Quote) */}
          <ProductPurchasePanel product={product} />

          {/* Industrial Trust Badges */}
          <div className="pdp-guarantee-grid">
            <div className="guarantee-card">
              <div className="guarantee-icon mono">
                <Wrench size={18} />
              </div>
              <div className="guarantee-text">
                <strong>DIN / ISO Standardized</strong>
                <small>Calibrated dimensions & tensile class</small>
              </div>
            </div>

            <div className="guarantee-card">
              <div className="guarantee-icon mono">
                <Truck size={18} />
              </div>
              <div className="guarantee-text">
                <strong>Fast Pan-India Dispatch</strong>
                <small>Dispatched in 24-48h with tracking</small>
              </div>
            </div>

            <div className="guarantee-card">
              <div className="guarantee-icon mono">
                <ShieldCheck size={18} />
              </div>
              <div className="guarantee-text">
                <strong>Verified Invoicing</strong>
                <small>100% compliant B2B GST tax credit</small>
              </div>
            </div>

            <div className="guarantee-card">
              <div className="guarantee-icon mono">
                <PackageCheck size={18} />
              </div>
              <div className="guarantee-text">
                <strong>Industrial Box Packing</strong>
                <small>Corrosion-protected warehouse pack</small>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* C. Lower PDP Technical Structure */}
      <div className="pdp-lower-sections">
        {/* 1. Full Description (if different from short description) */}
        {product.description && product.description !== product.short_description ? (
          <section className="pdp-section pdp-description-section" id="product-overview">
            <div className="pdp-section-header">
              <h2>Product Overview & Description</h2>
            </div>
            <div
              className="pdp-section-prose"
              dangerouslySetInnerHTML={{ __html: cleanDescriptionHtml(product.description) }}
            />
          </section>
        ) : null}

        {/* 2. Technical Specifications & Dimension Table */}
        <SpecificationTable product={product} acf={acf} />

        {/* 3. Standards & Compliance Badges */}
        <ComplianceSection acf={acf} />

        {/* 4. Applications, Tooling & Care Guide */}
        <ApplicationsSection acf={acf} />

        {/* 5. Technical Downloads (Datasheet PDF, 3D CAD STEP, Certificates) */}
        <TechnicalDownloads acf={acf} />

        {/* 6. Why Choose / Quality Assurance / FAQs */}
        <ProfessionalPdpSections acf={acf} />

        {/* 7. Real WooCommerce Product Reviews */}
        <ProductReviews product={product} />

        {/* 8. Related Products & Matching Hardware */}
        {related?.length ? (
          <section className="section related-products-section" id="related-fasteners">
            <div className="section-title">
              <div>
                <span className="eyebrow">Related Hardware</span>
                <h2>Matching Screws, Nuts & Accessories</h2>
              </div>
            </div>
            <ProductGrid products={related} />
          </section>
        ) : null}
      </div>

      {/* Floating Sticky Add to Cart Bar on Scroll */}
      <StickyBuyBar product={product} />
    </div>
  );
}
