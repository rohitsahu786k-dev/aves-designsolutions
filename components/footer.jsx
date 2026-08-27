import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { FooterPolicyLinks } from "@/components/footer-policy-links";
import { getStoreContactInfo } from "@/lib/wp-storefront";

export async function Footer() {
  const contact = await getStoreContactInfo().catch(() => ({}));
  const year = new Date().getFullYear();

  const phoneDisplay = contact.phonePrimary || "+91 81077 53647";
  const phoneRaw = phoneDisplay.replace(/[^0-9+]/g, "");
  const whatsappNum = contact.whatsappNumber || "918107753647";
  const storeAddress = [contact.addressLine1, contact.addressLine2, contact.city, contact.state, contact.postalCode]
    .filter(Boolean)
    .join(", ") || "2, Paneri Belda Road, Udaipur, Rajasthan, India";

  const workingHours = contact.supportHours || "9:00 AM - 6:00 PM (Mon - Sat)";

  return (
    <footer className="site-footer white-theme-footer">
      <div className="container">
        <div className="footer-intro-bar">
          <div>
            <span className="eyebrow">Industrial procurement desk</span>
            <h2>Fasteners, hardware and bulk sourcing support.</h2>
          </div>
          <p>Live stock, GST invoicing, technical guidance and dispatch-ready packs for trade buyers.</p>
        </div>

        <div className="footer-seo-copy" aria-label="About screwnet">
          <p>
            screwnet supplies screws, bolts, nuts, washers, anchors and stainless steel fasteners from Udaipur with
            product-led catalog browsing and bulk quotation support.
          </p>
        </div>

        <div className="footer-grid">
          <div className="footer-brand-column">
            <Link className="screwnet-brand" href="/" aria-label="screwnet homepage">
              <span className="brand-logo-text">
                <span className="brand-logo-main">screw</span>
                <span className="brand-logo-accent">net</span>
              </span>
              <span className="brand-logo-sub">.in</span>
            </Link>
            <p>
              DIN/ISO standardized screws, high-tensile bolts, self-drilling fasteners and custom wholesale hardware
              with nationwide dispatch and dedicated technical support.
            </p>
            <div className="footer-social-links">
              <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noreferrer" className="social-pill whatsapp">
                <MessageCircle size={14} /> <span>WhatsApp Support</span>
              </a>
            </div>
            {contact.gstin ? <small className="footer-gstin-text">GSTIN: {contact.gstin}</small> : null}
          </div>

          <div className="footer-column">
            <h4>Catalog</h4>
            <Link href="/shop">All Fasteners</Link>
            <Link href="/shop?search=screw">Screws</Link>
            <Link href="/shop?search=bolt">Bolts & Nuts</Link>
            <Link href="/shop?orderby=date&order=desc">New Arrivals</Link>
            <Link href="/shop?on_sale=true">Bulk Deals</Link>
          </div>

          <div className="footer-column">
            <h4>Buyer Support</h4>
            <Link href="/contact">Bulk RFQ</Link>
            <Link href="/account">Account / Order Status</Link>
            <Link href="/wishlist">Saved Fasteners</Link>
            <Link href="/blog">Engineering Guides</Link>
            <FooterPolicyLinks />
          </div>

          <div className="footer-column contact-column">
            <h4>Contact</h4>
            <a href={`tel:${phoneRaw}`}><Phone size={14} /> {phoneDisplay}</a>
            <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp: {phoneDisplay}</a>
            {contact.salesEmail ? <a href={`mailto:${contact.salesEmail}`}><Mail size={14} /> {contact.salesEmail}</a> : null}
            <a href={contact.googleMapsUrl || "https://www.google.com/maps/search/?api=1&query=2+PANERI+BELDA+ROAD+UDAIPUR"} target="_blank" rel="noreferrer" className="footer-location">
              <MapPin size={14} /> {storeAddress}
            </a>
            <span className="footer-hours">
              <Clock size={14} /> {workingHours}
            </span>
            <div className="footer-trust-badge">
              <ShieldCheck size={15} /> <span>Verified GST invoicing</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="copyright-text">
            Copyright {year} <strong>screwnet</strong>. All rights reserved.
          </div>
          <div className="developer-credit">
            {contact.footerNote || "Industrial Hardware & Fasteners Supplier, Udaipur, India"}
          </div>
        </div>
      </div>
    </footer>
  );
}
