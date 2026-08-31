import Link from "next/link";
import { ClipboardCheck, Clock, Headphones, Mail, MapPin, MessageCircle, PackageCheck, Phone, ShieldCheck, Truck } from "lucide-react";
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
    <footer className="site-footer white-theme-footer pro-site-footer">
      <div className="container">
        <div className="footer-intro-bar">
          <div>
            <ClipboardCheck size={34} />
            <span>
              <h2>Need bulk quantities?</h2>
              <p>Get the best prices for your business.</p>
            </span>
          </div>
          <div className="footer-bulk-points">
            <span><PackageCheck size={16} /> Best Wholesale Prices</span>
            <span><Headphones size={16} /> Priority Support</span>
            <span><Mail size={16} /> Quick Response</span>
          </div>
          <Link href="/contact" className="footer-rfq-button">
            <ClipboardCheck size={16} /> Send Bulk RFQ
          </Link>
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
              Your trusted partner for industrial fasteners. Quality products, reliable service.
            </p>
            <div className="footer-social-links">
              <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noreferrer" className="social-pill whatsapp">
                <MessageCircle size={14} /> <span>WhatsApp Support</span>
              </a>
            </div>
            {contact.gstin ? <small className="footer-gstin-text">GSTIN: {contact.gstin}</small> : null}
          </div>

          <div className="footer-column">
            <h4>Shop</h4>
            <Link href="/shop">All Categories</Link>
            <Link href="/shop?search=screw">Screws</Link>
            <Link href="/shop?search=bolt">Bolts</Link>
            <Link href="/shop?search=nut">Nuts</Link>
            <Link href="/category/washers">Washers</Link>
            <Link href="/shop">View All Products</Link>
          </div>

          <div className="footer-column">
            <h4>Information</h4>
            <Link href="/about">About Us</Link>
            <Link href="/shop">Quality Catalog</Link>
            <Link href="/blog">Resources</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/contact">Careers</Link>
          </div>

          <div className="footer-column">
            <h4>Customer Service</h4>
            <Link href="/contact">Contact Us</Link>
            <Link href="/account">Track Order</Link>
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
              <Truck size={15} /> <span>Pan India dispatch</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="copyright-text">
            &copy; {year} screwnet. All rights reserved.
          </div>
          <div className="developer-credit">
            <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/UPI_logo.svg" alt="UPI" />
            <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/RuPay.svg" alt="RuPay" />
            <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/BHIM_logo.svg" alt="BHIM" />
            <img src="https://cdn.simpleicons.org/visa/1434CB" alt="Visa" />
            <img src="https://cdn.simpleicons.org/mastercard/EB001B" alt="Mastercard" />
            <img src="https://cdn.simpleicons.org/paytm/00BAF2" alt="Paytm" />
            <img src="https://cdn.simpleicons.org/phonepe/5F259F" alt="PhonePe" />
            <img src="https://cdn.simpleicons.org/googlepay/4285F4" alt="Google Pay" />
            <span><ShieldCheck size={14} /> ISO 9001:2015</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
