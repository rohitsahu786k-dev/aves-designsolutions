import { Montserrat } from "next/font/google";
import "./globals.css";
import "./storefront-polish.css";
import "./responsive-fixes.css";
import "./product-image-cover.css";
import "./sticky-header.css";
import "./wishlist-responsive.css";
import "./mobile-commerce-fixes.css";
import "./mobile-pdp-fix.css";
import "./ecommerce-redesign.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { GlobalCartDrawer } from "@/components/global-cart-drawer";
import { getStoreContactInfo } from "@/lib/wp-storefront";

const montserrat = Montserrat({
  variable: "--font-retail",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "screwnet | Industrial Screws, Fasteners & Hardware Online", template: "%s | screwnet" },
  description: "Buy industrial screws, self-drilling Tek screws, drywall screws, high tensile bolts, SS 304/316 fasteners, nuts and washers online at screwnet.",
  robots: { index: true, follow: true },
  verification: {
    google: "xjntV3GekeUY1GYlJT7kvNDcPDj9QIhyUgG8pxaCsMg",
  },
  openGraph: {
    type: "website",
    siteName: "screwnet",
    title: "screwnet | Industrial Fasteners & Screws Store",
    description: "Premium industrial fasteners, drywall screws, self-drilling screws, bolts and hardware with live inventory and fast shipping.",
  },
};

export default async function RootLayout({ children }) {
  const contact = await getStoreContactInfo().catch(() => ({}));

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={montserrat.variable}>
        <Header />
        <main>{children}</main>
        <Footer />
        <MobileBottomNav whatsappNumber={contact.whatsappNumber} />
        <GlobalCartDrawer />
      </body>
    </html>
  );
}
