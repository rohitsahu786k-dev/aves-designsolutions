"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Loader2, MessageSquare, Send, X } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

export function BulkEnquiryModal({ product, acf = {}, currentVariant = null, isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(acf.moq ? String(acf.moq * 5) : "500");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const productTitle = decodeHtml(product?.name || "Fasteners");
  const variantTitle = currentVariant?.attributes?.map((a) => `${a.name}: ${a.value}`).join(", ") || "";
  const sku = currentVariant?.sku || product?.sku || (acf.familyModelCode ? `Family: ${acf.familyModelCode}` : "");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !quantity.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const subject = `Bulk Quote Request: ${productTitle} (Qty: ${quantity})`;
      const message = `Product: ${productTitle}
SKU/Code: ${sku}
Selected Options: ${variantTitle || "Standard"}
Requested Quantity: ${quantity} units
Target Delivery: ${acf.dispatchLeadTime || "Standard"}

Customer Notes:
${notes || "Please provide tiered wholesale quotation and lead time."}`;

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject,
          message,
          query: "Commercial Bulk RFQ",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit request. Please try again or reach us on WhatsApp.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop bulk-modal-backdrop" onClick={onClose}>
      <div className="modal-content bulk-modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Request Bulk Quote">
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="bulk-success-view">
            <div className="success-icon-wrap">
              <CheckCircle2 size={48} className="text-black" />
            </div>
            <h2>Commercial RFQ Received!</h2>
            <p>
              Thank you <strong>{name}</strong>. Our engineering sales desk has received your quotation request for <strong>{quantity} pcs</strong> of <strong>{productTitle}</strong>.
            </p>
            <p className="subtext">
              We will email the formal GST proforma invoice & tiered pricing to <strong>{email}</strong> shortly.
            </p>
            <button type="button" className="button mt-4" onClick={onClose}>
              Continue Browsing Catalog
            </button>
          </div>
        ) : (
          <>
            <div className="bulk-modal-header">
              <div className="bulk-header-badge">
                <FileText size={16} />
                <span>B2B Commercial RFQ</span>
              </div>
              <h2>Request Tiered Bulk Quote</h2>
              <p>Direct carton, master pack and export bulk pricing for contractors & OEMs.</p>
            </div>

            <div className="bulk-product-summary-card">
              <div className="product-info-col">
                <strong>{productTitle}</strong>
                {variantTitle ? <span className="variant-pill">{variantTitle}</span> : null}
                {sku ? <small>SKU / Part Code: {sku}</small> : null}
              </div>
              {acf.moq ? <span className="moq-badge">MOQ: {acf.moq} pcs</span> : null}
            </div>

            {error ? <div className="bulk-error-alert">{error}</div> : null}

            <form onSubmit={handleSubmit} className="bulk-quote-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="rfq-name">Your Name / Company *</label>
                  <input
                    id="rfq-name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma (Apex Engineering)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="rfq-email">Business Email *</label>
                  <input
                    id="rfq-email"
                    type="email"
                    required
                    placeholder="procurement@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="rfq-phone">Phone / WhatsApp *</label>
                  <input
                    id="rfq-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="rfq-qty">Required Quantity (pcs) *</label>
                  <input
                    id="rfq-qty"
                    type="number"
                    min={acf.moq || 1}
                    step={acf.quantityStep || 1}
                    required
                    placeholder={`Min: ${acf.moq || 1}`}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="rfq-notes">Special Requirements / MTC / Delivery Timeline</label>
                <textarea
                  id="rfq-notes"
                  rows={3}
                  placeholder="Need test certificates, custom surface coating or scheduled staggered dispatch..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="button bulk-submit-btn" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>{loading ? "Submitting RFQ..." : "Submit Quotation Request"}</span>
              </button>

              <small className="form-disclaimer">
                Our sales engineers respond within 2 business hours. GST invoices & formal proformas issued.
              </small>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
