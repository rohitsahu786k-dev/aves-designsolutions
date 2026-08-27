import { TopCategoryBubbleStrip } from "@/components/woodenstreet/top-category-bubble-strip";
import { PromoOfferGrid } from "@/components/woodenstreet/promo-offer-grid";
import { TrendingProductsSection } from "@/components/woodenstreet/trending-products-section";
import { ExploreCategoryGrid } from "@/components/woodenstreet/explore-category-grid";
import { CustomerStoriesSection } from "@/components/woodenstreet/customer-stories-section";
import { WhyChooseUs } from "@/components/woodenstreet/why-choose-us";
import { HeroCarousel } from "@/components/hero-carousel";
import { HomeEngineeringBento } from "@/components/home-engineering-bento";
import { BulkRfqBanner } from "@/components/bulk-rfq-banner";
import { HomeBlogShowcase } from "@/components/home-blog-showcase";
import { TextMarquee } from "@/components/text-marquee";
import { getCategories, getFrontPage, getPopularProducts, getPosts, getProducts, getProductsByCategory, getTopCategoriesFromProducts } from "@/lib/wp";
import { getBannersByPlacement, getMarqueeNotice } from "@/lib/wp-storefront";
import { yoastToMetadata } from "@/lib/utils";

export async function generateMetadata() {
  const page = await getFrontPage().catch(() => null);
  return yoastToMetadata(page?.yoast_head_json, {
    title: "screwnet | Industrial Screws, Bolts, Fasteners & Hardware India",
    description: "Buy industrial screws, self-drilling Tek screws, drywall screws, Grade 8.8 / 10.9 / 12.9 bolts, SS 304/316 fasteners, nuts and washers online at screwnet Udaipur.",
    alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
  });
}

export default async function Home({ searchParams }) {
  const query = await searchParams;
  const [
    products,
    popularProducts,
    categories,
    marqueeNotice,
    heroBanners,
    wpPosts,
  ] = await Promise.all([
    getProducts({ per_page: "16", orderby: "date", search: query?.search || "" }),
    getPopularProducts(),
    getCategories(),
    getMarqueeNotice(),
    getBannersByPlacement("home_hero"),
    getPosts({ per_page: "6" }).catch(() => []),
  ]);

  const countLeaders = categories
    .filter((category) => category.count > 0 && category.slug !== "uncategorized")
    .sort((a, b) => b.count - a.count);
  const topCategories = countLeaders.length ? countLeaders : getTopCategoriesFromProducts(popularProducts.length ? popularProducts : products);

  const enrichedCategories = await Promise.all(
    topCategories.slice(0, 10).map(async (category) => {
      const categoryProducts = await getProductsByCategory(category.id, { per_page: "8", orderby: "popularity" }).catch(() => []);
      return { ...category, image: category.image || categoryProducts[0]?.images?.[0], products: categoryProducts };
    })
  );

  const shelves = enrichedCategories.slice(0, 4).map((category) => ({ category, products: category.products }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "screwnet",
        url: siteUrl,
        logo: `${siteUrl}/images/screwnet-logo.png`,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+918107753647",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: "2 Paneri Belda Road",
          addressLocality: "Udaipur",
          addressRegion: "RJ",
          postalCode: "313001",
          addressCountry: "IN",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "09:00",
            closes: "18:00",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "screwnet",
        description: "India's Premier Industrial Screws & Fasteners Store",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/shop?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <TopCategoryBubbleStrip categories={enrichedCategories} />
      <HeroCarousel banners={heroBanners} />
      <PromoOfferGrid />
      <TrendingProductsSection products={products} popularProducts={popularProducts} shelves={shelves} />
      <TextMarquee text={marqueeNotice} />
      <ExploreCategoryGrid categories={enrichedCategories} />
      <HomeEngineeringBento />
      <BulkRfqBanner />
      <CustomerStoriesSection />
      <WhyChooseUs />
      <HomeBlogShowcase posts={wpPosts} />

      <section className="section home-seo-block">
        <div className="container max-w-5xl">
          <details className="home-seo-details">
            <summary>screwnet online fastener and hardware store in India</summary>
            <div className="seo-prose">
              <p>
                screwnet supplies industrial screws, high-tensile structural bolts, self-drilling Tek screws,
                drywall fasteners, concrete wedge anchors, and SS 304 / SS 316 stainless steel hardware from
                Udaipur, Rajasthan.
              </p>
              <p>
                Buyers can order from live warehouse inventory with DIN / ISO specifications, master carton
                volume discounts, GST invoices, and pan-India tracked dispatch.
              </p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
