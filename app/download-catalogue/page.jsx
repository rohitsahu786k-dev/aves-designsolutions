import { DownloadCatalogueView } from "@/components/download-catalogue-view";
import "@/app/download-catalogue.css";

export const metadata = {
  title: "Download Fastener Catalogue & Engineering Specifications | screwnet",
  description:
    "Download official 2026 screwnet industrial fastener catalogues, SS304/SS316 stainless steel specification sheets, torque ratings, and DIN/ISO dimensional blueprints.",
  alternates: {
    canonical: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://screwnet.in").replace(/\/$/, "")}/download-catalogue`,
  },
  openGraph: {
    title: "Download Fastener Catalogue & Engineering Specifications | screwnet",
    description:
      "Get instant access to complete dimensions, DIN/ISO standards, tensile ratings, and torque specs for 5,000+ precision screws and industrial fasteners.",
    url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://screwnet.in").replace(/\/$/, "")}/download-catalogue`,
    type: "website",
  },
};

export const revalidate = 30;

async function getCatalogueData() {
  const wpUrl = process.env.NEXT_PUBLIC_WP_URL || "https://wp.screwnet.in";
  try {
    const res = await fetch(`${wpUrl}/wp-json/screwnet/v1/catalogue`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch live catalogue data from WordPress bridge:", err);
  }

  // Fallback data if WP is temporarily offline
  return {
    badge: "screwnet Technical Fasteners",
    title: "Download Official Fastener Catalogues & Engineering Specifications",
    subtitle:
      "Get instant access to complete dimensions, DIN/ISO standards, tensile ratings, and torque specs for 5,000+ precision screws and industrial fasteners.",
    banner_desktop: "",
    banner_mobile: "",
    catalogues: [
      {
        id: "screwnet-master-catalogue-2026",
        doc_title: "screwnet Master Industrial Fasteners Catalogue 2026",
        doc_subtitle:
          "Complete technical specifications, DIN/ISO dimensional charts, and load ratings for machine screws, socket heads, hex bolts, nuts, and washers.",
        doc_file: "https://wp.screwnet.in/wp-content/uploads/2026/08/screwnet_Fasteners_Master_Catalog_2026.pdf",
        doc_thumbnail:
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        doc_size: "18.4 MB",
        doc_pages: "96 Pages",
        doc_edition: "2026 Edition",
        category: "Master Catalogue",
      },
      {
        id: "ss304-ss316-specification-guide",
        doc_title: "Stainless Steel (SS304 & SS316) Fastener Technical Sheet",
        doc_subtitle:
          "Corrosion resistance ratings, chemical composition, torque values, and marine/coastal grade selection criteria.",
        doc_file: "https://wp.screwnet.in/wp-content/uploads/2026/08/SS304_SS316_Technical_Fastener_Guide.pdf",
        doc_thumbnail:
          "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
        doc_size: "8.2 MB",
        doc_pages: "42 Pages",
        doc_edition: "Rev 4.1",
        category: "Stainless Steel",
      },
      {
        id: "high-tensile-grade-handbook",
        doc_title: "High Tensile Grade 8.8 & 10.9 Fastener Engineering Manual",
        doc_subtitle:
          "Proof stress, shear strength, ultimate tensile strength (UTS), and precision automotive/structural clamping requirements.",
        doc_file: "https://wp.screwnet.in/wp-content/uploads/2026/08/High_Tensile_Grade_8.8_10.9_Fasteners_Manual.pdf",
        doc_thumbnail:
          "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
        doc_size: "12.5 MB",
        doc_pages: "58 Pages",
        doc_edition: "ISO 898-1 Certified",
        category: "High Tensile",
      },
      {
        id: "metric-thread-pitch-torque-matrix",
        doc_title: "Standard Metric Thread Pitch & Torque Matrix (M2 – M36)",
        doc_subtitle:
          "Coarse & fine pitch dimensions, tap drill sizes, tightening torque recommendations, and thread engagement depths.",
        doc_file: "https://wp.screwnet.in/wp-content/uploads/2026/08/Metric_Thread_Pitch_Torque_Chart.pdf",
        doc_thumbnail:
          "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80",
        doc_size: "4.8 MB",
        doc_pages: "24 Pages",
        doc_edition: "DIN 13-1 Spec",
        category: "Thread Standards",
      },
    ],
    features: [
      {
        feature_title: "5,000+ Fastener Sizes in Ready Stock",
        feature_desc:
          "SS304, SS316, Grade 8.8, 10.9, Brass & Nickel-plated precision hardware available for immediate bulk dispatch.",
      },
      {
        feature_title: "DIN, ISO & ASTM Certified Tolerances",
        feature_desc:
          "Strict 6g / 6H thread fit gauges ensure perfect engagement without galling or thread stripping in production.",
      },
      {
        feature_title: "EN 10204 3.1 Mill Test Certificates",
        feature_desc:
          "Every batch is backed by 100% material traceability and laboratory chemical analysis reports.",
      },
      {
        feature_title: "24-48h Express Pan-India Delivery",
        feature_desc:
          "Doorstep freight delivery with real-time consignment tracking via Delhivery, BlueDart, and DTDC.",
      },
    ],
    contact: {
      email: "aves.designsolutions@gmail.com",
      phone: "+91 81077 53647",
      phone_display: "+91 81077 53647",
      whatsapp: "918107753647",
      address: "2, Paneri Belda Road, Udaipur, Rajasthan, India",
      working_hours: "Monday – Saturday: 9:00 AM – 6:30 PM",
    },
  };
}

export default async function DownloadCataloguePage() {
  const data = await getCatalogueData();

  return (
    <main>
      <DownloadCatalogueView initialData={data} />
    </main>
  );
}
