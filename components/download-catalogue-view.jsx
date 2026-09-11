"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  X
} from "lucide-react";

export function DownloadCatalogueView({ initialData }) {
  const [data] = useState(initialData || {});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    catalogue_id: "",
    catalogue_title: "",
  });
  const [activeModal, setActiveModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const catalogues = data.catalogues || [];
  const features = data.features || [];
  const contact = data.contact || {};

  const handleOpenEmailModal = (doc) => {
    setForm((prev) => ({
      ...prev,
      catalogue_id: doc.id || doc.doc_title,
      catalogue_title: doc.doc_title,
    }));
    setActiveModal(doc);
    setFeedback(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.email.includes("@")) {
      setFeedback({ type: "error", message: "Please enter a valid business or personal email." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("https://wp.screwnet.in/wp-json/screwnet/v1/catalogue/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({
          type: "success",
          message: `Success! Catalogue download link has been sent to ${form.email}.`,
        });
        // Trigger direct browser download if file URL is available
        if (activeModal?.doc_file) {
          window.open(activeModal.doc_file, "_blank");
        }
      } else {
        setFeedback({
          type: "error",
          message: json.message || "Failed to send catalogue email. Please try again.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: "Network error occurred. Please try again or contact us directly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="catalogue-page-wrapper">
      {/* 1. HERO SECTION */}
      <section className="catalogue-hero-section">
        <div className="container">
          <div className="catalogue-hero-inner">
            <div className="catalogue-hero-eyebrow">
              <BookOpen size={14} />
              <span>{data.badge || "screwnet Technical Fasteners"}</span>
            </div>

            <h1 className="catalogue-hero-heading">
              {data.title || "Download Official Fastener Catalogues & Engineering Specifications"}
            </h1>

            <p className="catalogue-hero-sub">
              {data.subtitle ||
                "Get instant access to complete dimensions, DIN/ISO standards, tensile ratings, and torque specs for 5,000+ precision screws and industrial fasteners."}
            </p>

            {/* Quick Action Buttons */}
            <div className="catalogue-hero-actions">
              <a href="#catalogues-list" className="catalogue-btn-primary">
                <Download size={16} />
                <span>Browse All Catalogues</span>
              </a>
              <a
                href={`https://wa.me/${contact.whatsapp || "918107753647"}?text=${encodeURIComponent(
                  "Hello Screwnet Team, I would like to request the 2026 industrial fastener catalogue and bulk pricing."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="catalogue-btn-secondary"
              >
                <MessageCircle size={16} />
                <span>WhatsApp Procurement</span>
              </a>
            </div>

            {/* Optional Banner Image (Desktop / Mobile from ACF) */}
            {data.banner_desktop && (
              <div className="catalogue-banner-container desktop-only">
                <img src={data.banner_desktop} alt="Screwnet Fastener Catalogue Banner" />
              </div>
            )}
            {data.banner_mobile && (
              <div className="catalogue-banner-container mobile-only">
                <img src={data.banner_mobile} alt="Screwnet Fastener Catalogue Mobile Banner" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. CATALOGUES LIST GRID */}
      <section id="catalogues-list" className="catalogue-grid-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-pre-tag">Available PDF Documentation</span>
              <h2 className="section-main-title">Engineering Guides & Product Catalogues</h2>
            </div>
            <p className="section-desc-note">
              Click “Download PDF” for direct offline reading, or “Send to Email” to get a permanent copy in your inbox.
            </p>
          </div>

          <div className="catalogue-cards-grid">
            {catalogues.map((doc, idx) => (
              <article className="catalogue-doc-card" key={doc.id || idx}>
                <div className="catalogue-card-cover">
                  {doc.doc_thumbnail ? (
                    <img src={doc.doc_thumbnail} alt={doc.doc_title} className="catalogue-thumb-img" />
                  ) : (
                    <div className="catalogue-placeholder-cover">
                      <FileText size={44} />
                      <span>{doc.doc_edition || "2026 Edition"}</span>
                    </div>
                  )}
                  <div className="catalogue-format-badge">
                    <span>PDF</span>
                  </div>
                </div>

                <div className="catalogue-card-content">
                  <div className="catalogue-card-meta">
                    {doc.category && <span className="cat-category-pill">{doc.category}</span>}
                    {doc.doc_size && <span className="cat-meta-stat">{doc.doc_size}</span>}
                    {doc.doc_pages && <span className="cat-meta-stat">&bull; {doc.doc_pages}</span>}
                  </div>

                  <h3 className="catalogue-card-title">{doc.doc_title}</h3>
                  <p className="catalogue-card-sub">{doc.doc_subtitle}</p>

                  <div className="catalogue-card-actions">
                    {doc.doc_file ? (
                      <a
                        href={doc.doc_file}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="catalogue-download-action"
                      >
                        <ArrowDownToLine size={15} />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal(doc)}
                        className="catalogue-download-action"
                      >
                        <ArrowDownToLine size={15} />
                        <span>Request PDF</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEmailModal(doc)}
                      className="catalogue-email-action"
                      title="Send copy to your email"
                    >
                      <Mail size={15} />
                      <span>Email Copy</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. KEY ENGINEERING & QUALITY HIGHLIGHTS (FROM ACF) */}
      <section className="catalogue-features-section">
        <div className="container">
          <div className="catalogue-features-header">
            <span className="section-pre-tag">Quality & Reliability</span>
            <h2 className="section-main-title">Why Indian Engineers & OEMs Trust screwnet</h2>
          </div>

          <div className="catalogue-features-grid">
            {features.map((feat, i) => (
              <div className="catalogue-feature-box" key={i}>
                <div className="catalogue-feature-icon-wrapper">
                  {i === 0 && <Award size={20} />}
                  {i === 1 && <ShieldCheck size={20} />}
                  {i === 2 && <FileSpreadsheet size={20} />}
                  {i === 3 && <Truck size={20} />}
                  {i > 3 && <Sparkles size={20} />}
                </div>
                <h4 className="catalogue-feature-heading">{feat.feature_title}</h4>
                <p className="catalogue-feature-text">{feat.feature_desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROCUREMENT CONTACT & FASTENER SUPPORT */}
      <section className="catalogue-contact-section">
        <div className="container">
          <div className="catalogue-contact-card">
            <div className="catalogue-contact-left">
              <span className="section-pre-tag">Direct Engineering Support</span>
              <h3 className="catalogue-contact-title">Need Custom Fastener Specs or Bulk Quotes?</h3>
              <p className="catalogue-contact-sub">
                Our fastener engineers can provide 3D CAD step files, EN 10204 3.1 material test certificates, or custom CNC length fabrication quotes.
              </p>

              <div className="catalogue-contact-points">
                <div className="catalogue-point-item">
                  <Mail size={16} />
                  <div>
                    <strong>Procurement Email</strong>
                    <a href={`mailto:${contact.email || "aves.designsolutions@gmail.com"}`}>
                      {contact.email || "aves.designsolutions@gmail.com"}
                    </a>
                  </div>
                </div>

                <div className="catalogue-point-item">
                  <Phone size={16} />
                  <div>
                    <strong>Sales Helpline</strong>
                    <a href={`tel:${contact.phone || "+918107753647"}`}>
                      {contact.phone_display || contact.phone || "+91 81077 53647"}
                    </a>
                  </div>
                </div>

                <div className="catalogue-point-item">
                  <MapPin size={16} />
                  <div>
                    <strong>Warehouse & Office</strong>
                    <span>{contact.address || "2, Paneri Belda Road, Udaipur, Rajasthan, India"}</span>
                  </div>
                </div>

                <div className="catalogue-point-item">
                  <Clock size={16} />
                  <div>
                    <strong>Working Hours</strong>
                    <span>{contact.working_hours || "Monday – Saturday: 9:00 AM – 6:30 PM"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Request Form */}
            <div className="catalogue-contact-right">
              <div className="catalogue-form-card">
                <h4>Instant Catalogue & Price Sheet Request</h4>
                <p>Fill your details below to receive our latest 2026 industrial catalogue directly in your inbox.</p>

                {feedback && (
                  <div className={`catalogue-alert ${feedback.type === "success" ? "success" : "error"}`}>
                    {feedback.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
                    <span>{feedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="catalogue-quick-form">
                  <div className="cat-form-group">
                    <label htmlFor="cat-name">Full Name / Contact Person</label>
                    <input
                      id="cat-name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="cat-form-group">
                    <label htmlFor="cat-email">Work / Personal Email *</label>
                    <input
                      id="cat-email"
                      type="email"
                      placeholder="rahul@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="cat-form-row">
                    <div className="cat-form-group">
                      <label htmlFor="cat-phone">Phone / WhatsApp</label>
                      <input
                        id="cat-phone"
                        type="tel"
                        placeholder="10-digit mobile"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div className="cat-form-group">
                      <label htmlFor="cat-company">Company / Organization</label>
                      <input
                        id="cat-company"
                        type="text"
                        placeholder="Optional"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} className="catalogue-submit-btn">
                    {submitting ? "Sending Catalogue..." : "Get Instant Catalogue Access"}
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EMAIL MODAL */}
      {activeModal && (
        <div className="catalogue-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="catalogue-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="catalogue-modal-header">
              <h3>Email Copy of Catalogue</h3>
              <button
                type="button"
                className="catalogue-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <p className="catalogue-modal-intro">
              We will send a download link for <strong>{activeModal.doc_title}</strong> to your email address.
            </p>

            {feedback && (
              <div className={`catalogue-alert ${feedback.type === "success" ? "success" : "error"}`}>
                {feedback.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="catalogue-modal-form">
              <div className="cat-form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="cat-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="rahul@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="cat-form-group">
                <label>Phone / WhatsApp Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="catalogue-modal-actions">
                <button type="button" onClick={() => setActiveModal(null)} className="catalogue-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="catalogue-btn-primary">
                  {submitting ? "Sending..." : "Dispatch Download Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
