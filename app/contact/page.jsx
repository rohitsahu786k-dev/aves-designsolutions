import Link from "next/link";
import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { getPage } from "@/lib/wp";
import { getStoreContactInfo } from "@/lib/wp-storefront";
import { yoastToMetadata } from "@/lib/utils";
import { ContactForm } from "@/components/contact-form";

export async function generateMetadata() {
  const page = await getPage("contact-us").catch(() => null);
  return yoastToMetadata(page?.yoast_head_json, {
    title: "Contact Us & B2B RFQ | screwnet Industrial Fasteners Udaipur",
    description: "Contact screwnet in Udaipur, Rajasthan. Call/WhatsApp +91 81077 53647 for customer support, fastener technical specs, bulk contractor orders and GST proforma quotes.",
  });
}

export default async function ContactPage() {
  const contact = await getStoreContactInfo();

  const phoneDisplay = contact.phonePrimary || "+91 81077 53647";
  const phoneRaw = phoneDisplay.replace(/[^0-9+]/g, "");
  const whatsappNum = contact.whatsappNumber || "918107753647";
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent("Hello screwnet, I would like to inquire about screws and fasteners.")}`;

  const address = [contact.addressLine1, contact.addressLine2, contact.city, contact.state, contact.postalCode, contact.country]
    .filter(Boolean)
    .join(", ") || "2, Paneri Belda Road, Udaipur, Rajasthan 313001, India";

  const mapQuery = encodeURIComponent(address);
  const mapEmbedUrl = contact.mapEmbedUrl || `https://maps.google.com/maps?q=${mapQuery}&t=m&z=15&output=embed&iwloc=near`;
  const directionsUrl = contact.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="container contact-page-shell">
      <div className="page-hero">
        <span className="eyebrow">Contact & Technical Support</span>
        <h1>Get in Touch with screwnet</h1>
        <p className="muted">
          For industrial fasteners, metric/imperial bolt sizing, bulk contractor RFQ pricing, order status, or technical specifications, our team is ready to assist.
        </p>
      </div>

      <div className="contact-layout">
        <ContactForm />

        <aside className="summary-panel contact-info-panel">
          <h2>Store & Engineering Sales Desk</h2>

          <div className="contact-details-list">
            <div className="contact-detail-row">
              <Phone size={18} className="contact-detail-icon mono" />
              <div>
                <strong>Direct Sales & Support:</strong>
                <a href={`tel:${phoneRaw}`} className="contact-link">
                  {phoneDisplay}
                </a>
                {contact.phoneSecondary ? (
                  <a href={`tel:${contact.phoneSecondary.replace(/[^0-9+]/g, "")}`} className="contact-sublink">
                    Alt: {contact.phoneSecondary}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="contact-detail-row">
              <MessageCircle size={18} className="contact-detail-icon mono" />
              <div>
                <strong>WhatsApp Order Desk:</strong>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="contact-link whatsapp-highlight">
                  Chat on WhatsApp ({phoneDisplay}) <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {contact.salesEmail || contact.supportEmail ? (
              <div className="contact-detail-row">
                <Mail size={18} className="contact-detail-icon mono" />
                <div>
                  <strong>Email Quotations:</strong>
                  {contact.salesEmail ? (
                    <a href={`mailto:${contact.salesEmail}`} className="contact-link">
                      {contact.salesEmail}
                    </a>
                  ) : null}
                  {contact.supportEmail && contact.supportEmail !== contact.salesEmail ? (
                    <a href={`mailto:${contact.supportEmail}`} className="contact-sublink">
                      Support: {contact.supportEmail}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="contact-detail-row">
              <MapPin size={18} className="contact-detail-icon mono" />
              <div>
                <strong>Office & Fulfillment Center:</strong>
                <p className="address-text">{address}</p>
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="directions-link">
                  Open in Google Maps <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="contact-detail-row">
              <Clock size={18} className="contact-detail-icon mono" />
              <div>
                <strong>Business Hours:</strong>
                <p className="hours-text">{contact.supportHours || "9:00 AM - 6:00 PM (Mon - Sat)"}</p>
              </div>
            </div>

            {contact.gstin ? (
              <div className="contact-gstin-box">
                <ShieldCheck size={16} className="text-black" />
                <span>GSTIN: <strong>{contact.gstin}</strong></span>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <section className="section map-section">
        <div className="map-header-row">
          <div>
            <h2>Warehouse Location & Directions</h2>
            <p className="muted">{address}</p>
          </div>
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="button button-outline get-directions-btn">
            <span>Get Driving Directions</span>
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="map-frame-box">
          <iframe
            loading="lazy"
            title={`screwnet location - ${address}`}
            src={mapEmbedUrl}
            className="map-iframe"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
}
