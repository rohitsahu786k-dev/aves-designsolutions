import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./storefront-polish.css";
import "./responsive-fixes.css";
import "./product-image-cover.css";
import "./sticky-header.css";
import "./wishlist-responsive.css";
import "./mobile-commerce-fixes.css";
import "./mobile-pdp-fix.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { GlobalCartDrawer } from "@/components/global-cart-drawer";

const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-retail", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const outfit = Outfit({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "screwnet | Industrial Screws, Fasteners & Hardware Online", template: "%s | screwnet" },
  description: "Buy industrial screws, self-drilling Tek screws, drywall screws, high tensile bolts, SS 304/316 fasteners, nuts and washers online at screwnet.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "screwnet",
    title: "screwnet | Industrial Fasteners & Screws Store",
    description: "Premium industrial fasteners, drywall screws, self-drilling screws, bolts and hardware with live inventory and fast shipping.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${outfit.variable}`}>
        <Header />
        <main>{children}</main>
        <Footer />
        <MobileBottomNav />
        <GlobalCartDrawer />
      </body>
    </html>
  );
}
