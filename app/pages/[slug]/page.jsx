import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getPage } from "@/lib/wp";
import { decodeHtml, stripHtml, yoastToMetadata } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  return yoastToMetadata(page?.yoast_head_json, {
    title: decodeHtml(page?.title?.rendered || "Policy & Information | screwnet"),
    description: stripHtml(page?.content?.rendered || "Screwnet policy and store details."),
  });
}

export default async function ContentPage({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);

  const title = decodeHtml(page?.title?.rendered || "Store Policy");
  const contentHtml = page?.content?.rendered || "<p>Information for this page is being updated. Please contact support.</p>";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: stripHtml(contentHtml).slice(0, 160),
    url: `${siteUrl}/pages/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "screwnet",
      url: siteUrl,
    },
  };

  return (
    <div className="container" style={{ maxWidth: "860px", padding: "2.5rem 1rem 4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="breadcrumbs" style={{ marginBottom: "1.5rem" }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Policies</span>
        <span>/</span>
        <span>{title}</span>
      </nav>

      <div className="page-hero" style={{ textAlign: "left", padding: "0 0 1.5rem", borderBottom: "1px solid #e2e8f0" }}>
        <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <ShieldCheck size={14} /> Official Store Policy
        </span>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0.5rem 0" }}>{title}</h1>
      </div>

      <article className="section content" style={{ fontSize: "0.95rem", lineHeight: "1.7", color: "#334155" }} dangerouslySetInnerHTML={{ __html: contentHtml }} />

      <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" className="button secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
          <ArrowLeft size={14} /> Back to Homepage
        </Link>
        <Link href="/contact" className="button" style={{ fontSize: "0.85rem" }}>
          Contact Support Desk
        </Link>
      </div>
    </div>
  );
}
