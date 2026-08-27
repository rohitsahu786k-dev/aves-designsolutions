import { CollectionBrowser } from "@/components/collection-browser";
import { decodeHtml, stripHtml } from "@/lib/utils";

export function CollectionShell({ title, description, products = [], pagination, categories = [], attributes = [], basePath = "/shop", activeQuery = {} }) {
  const cleanTitle = decodeHtml(title);
  const cleanDesc = stripHtml(description || `Explore our complete range of ${cleanTitle} at screwnet.`);

  const totalCount = pagination?.total || products.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: cleanTitle,
    description: cleanDesc,
    url: typeof window !== "undefined" ? window.location.href : basePath,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: products.slice(0, 12).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: decodeHtml(item.name),
        url: item.permalink || `${basePath}/product/${item.slug}`,
      })),
    },
  };

  return (
    <div className="collection-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <div className="collection-heading">
          <div>
            <span className="eyebrow">screwnet Fastener Catalog</span>
            <h1>{cleanTitle}</h1>
            {description ? <p>{stripHtml(description).slice(0, 220)}</p> : null}
          </div>
        </div>
        <CollectionBrowser products={products} pagination={pagination} categories={categories} attributes={attributes} basePath={basePath} activeQuery={activeQuery} />

        {/* Collection Bottom SEO Content Block */}
        <section className="collection-bottom-seo mt-12 pt-8 border-t border-slate-200">
          <div className="seo-card bg-slate-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Buy {cleanTitle} Online in India - screwnet</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Discover high quality <strong>{cleanTitle}</strong> engineered for fabricators, contractors, and DIY builders. Sourced with full dimensional DIN/ISO precision and live stock tracking across India.
            </p>
            <p className="text-xs text-slate-500">
              All fasteners in the {cleanTitle} category are backed by fast dispatch, instant GST invoicing, and verified checkout.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
