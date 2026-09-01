import { TopCategoryBubbleStrip } from "@/components/woodenstreet/top-category-bubble-strip";
import { PromoOfferGrid } from "@/components/woodenstreet/promo-offer-grid";
import { TrendingProductsSection } from "@/components/woodenstreet/trending-products-section";
import { ExploreCategoryGrid } from "@/components/woodenstreet/explore-category-grid";
import { CustomerStoriesSection } from "@/components/woodenstreet/customer-stories-section";
import { WhyChooseUs } from "@/components/woodenstreet/why-choose-us";
import { HeroCarousel } from "@/components/hero-carousel";
import { HomeBlogShowcase } from "@/components/home-blog-showcase";
import { TextMarquee } from "@/components/text-marquee";
import { getCategories, getFrontPage, getPopularProducts, getPosts, getProducts, getProductsByCategory, getTopCategoriesFromProducts } from "@/lib/wp";
import { getBannersByPlacement, getMarqueeNotice, getStoreContactInfo } from "@/lib/wp-storefront";
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
    contact,
  ] = await Promise.all([
    getProducts({ per_page: "16", orderby: "date", search: query?.search || "" }),
    getPopularProducts(),
    getCategories(),
    getMarqueeNotice(),
    getBannersByPlacement("home_hero"),
    getPosts({ per_page: "6" }).catch(() => []),
    getStoreContactInfo().catch(() => ({})),
  ]);

  const categoryList = categories
    .filter((category) => category.slug !== "uncategorized")
    .sort((a, b) => Number(a.menu_order || 0) - Number(b.menu_order || 0));
  const topCategories = categoryList.length ? categoryList : getTopCategoriesFromProducts(popularProducts.length ? popularProducts : products);

  const enrichedCategories = topCategories;
  const shelfCategories = topCategories.filter((category) => Number(category.count || 0) > 0).slice(0, 4);
  const shelfProductGroups = await Promise.all(
    shelfCategories.map((category) =>
      getProductsByCategory(category.id, { per_page: "8", orderby: "popularity" })
        .then((categoryProducts) => ({ category, products: categoryProducts }))
        .catch(() => ({ category, products: [] }))
    )
  );

  const shelves = shelfProductGroups.filter((shelf) => shelf.products.length > 0);

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
          telephone: contact.phonePrimary || "+918107753647",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: contact.addressLine1 || "2 Paneri Belda Road",
          addressLocality: contact.city || "Udaipur",
          addressRegion: contact.state || "RJ",
          postalCode: contact.postalCode || "313001",
          addressCountry: contact.country || "IN",
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
      <WhyChooseUs />
      <TrendingProductsSection products={products} popularProducts={popularProducts} shelves={shelves} initialTab="new" />
      <TextMarquee text={marqueeNotice} />
      <ExploreCategoryGrid categories={enrichedCategories} />
      <PromoOfferGrid />
      <CustomerStoriesSection />
      <HomeBlogShowcase posts={wpPosts} />
    </>
  );
}
