import Link from "next/link";
import { Hammer, PackageCheck, ShieldCheck, Wrench } from "lucide-react";
import { getPage } from "@/lib/wp";
import { decodeHtml, stripHtml, yoastToMetadata } from "@/lib/utils";

export const revalidate = 86400;

export async function generateMetadata() {
  const page = await getPage("about-us").catch(() => null);
  return yoastToMetadata(page?.yoast_head_json, {
    title: "About screwnet | Industrial Fasteners & Screws Supplier India",
    description: "Learn about screwnet, India's trusted online destination for industrial screws, bolts, self-drilling fasteners, and architectural hardware based in Udaipur.",
  });
}

export default async function AboutPage() {
  const page = await getPage("about-us").catch(() => null);

  return (
    <div>
      <section className="about-hero">
        <div className="container about-grid">
          <div>
            <span className="eyebrow">About screwnet</span>
            <h1>{decodeHtml(page?.title?.rendered || "Engineered Fasteners for Builders, Fabricators & Industry")}</h1>
            <p>
              {stripHtml(page?.content?.rendered || "").slice(0, 260) ||
                "screwnet is an online industrial fasteners supplier delivering precision self-drilling screws, drywall fasteners, high tensile bolts, SS 304/316 marine hardware, and anchors across India with live stock tracking and transparent pricing."}
            </p>
            <Link className="button" href="/shop">
              Explore Fastener Catalog
            </Link>
          </div>
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <img
              src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
              alt="screwnet industrial fasteners warehouse"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container values-grid">
          <div>
            <Wrench />
            <h3>Industrial Grade Standards</h3>
            <p>All screws, bolts, and anchors comply with DIN/ISO dimensional standards and tensile load specs.</p>
          </div>
          <div>
            <ShieldCheck />
            <h3>Corrosion Resistant Finishes</h3>
            <p>From zinc plating and Ruspert/Dacromet coatings to SS 304/316 austenitic stainless steel.</p>
          </div>
          <div>
            <PackageCheck />
            <h3>B2B & B2C Fast Shipping</h3>
            <p>Convenient pack sizes, bulk box orders, instant GST invoicing, and pan-India logistics.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
