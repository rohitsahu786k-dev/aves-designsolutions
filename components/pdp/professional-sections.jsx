"use client";

import { CheckCircle2, ChevronDown, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { cleanDescriptionHtml, decodeHtml } from "@/lib/utils";

/**
 * Parses WYSIWYG FAQ markup into structured { question, answerHtml } pairs if standard H3/H4/strong headings exist.
 */
function parseFaqContent(html = "") {
  if (!html || typeof html !== "string") return null;

  // Try parsing <h3>...</h3> / <h4>...</h4> question blocks
  const parts = html.split(/<h[34][^>]*>(.*?)<\/h[34]>/gi);
  if (parts.length >= 3) {
    const items = [];
    for (let i = 1; i < parts.length; i += 2) {
      const q = parts[i]?.replace(/<[^>]*>/g, "").trim();
      const a = parts[i + 1]?.trim();
      if (q && a) {
        items.push({ question: decodeHtml(q), answerHtml: a });
      }
    }
    if (items.length > 0) return items;
  }

  // Try parsing <p><strong>Q: ...</strong></p>
  const pParts = html.split(/<p><strong>(.*?)<\/strong><\/p>/gi);
  if (pParts.length >= 3) {
    const items = [];
    for (let i = 1; i < pParts.length; i += 2) {
      const q = pParts[i]?.replace(/<[^>]*>/g, "").trim();
      const a = pParts[i + 1]?.trim();
      if (q && a) {
        items.push({ question: decodeHtml(q), answerHtml: a });
      }
    }
    if (items.length > 0) return items;
  }

  return null;
}

export function ProfessionalPdpSections({ acf = {} }) {
  const [openFaq, setOpenFaq] = useState(0);

  const parsedFaq = useMemo(() => parseFaqContent(acf.faqContent), [acf.faqContent]);

  const hasWhyBuy = Boolean(acf.whyBuyContent);
  const hasQA = Boolean(acf.qualityAssuranceContent);
  const hasFaq = Boolean(acf.faqContent);

  if (!hasWhyBuy && !hasQA && !hasFaq) {
    return null;
  }

  return (
    <div className="pdp-professional-sections-wrapper">
      {/* Why Choose This Product */}
      {hasWhyBuy ? (
        <section className="pdp-section pdp-why-buy-section" id="why-choose">
          <div className="pdp-section-header">
            <div className="pdp-section-icon why-buy">
              <Sparkles size={20} />
            </div>
            <div>
              <h2>Why Choose This Fastener</h2>
              <p>Performance advantages, precision cold-forging, and reliability benefits.</p>
            </div>
          </div>
          <div
            className="pdp-section-prose"
            dangerouslySetInnerHTML={{ __html: acf.whyBuyContent }}
          />
        </section>
      ) : null}

      {/* Quality Assurance & Traceability */}
      {hasQA ? (
        <section className="pdp-section pdp-qa-section" id="quality-assurance">
          <div className="pdp-section-header">
            <div className="pdp-section-icon qa">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2>Quality Assurance & Batch Traceability</h2>
              <p>Optical sorting, tensile testing, thread gauging and dimensional inspection.</p>
            </div>
          </div>
          <div
            className="pdp-section-prose"
            dangerouslySetInnerHTML={{ __html: acf.qualityAssuranceContent }}
          />
        </section>
      ) : null}

      {/* Product FAQs */}
      {hasFaq ? (
        <section className="pdp-section pdp-faq-section" id="frequently-asked-questions">
          <div className="pdp-section-header">
            <div className="pdp-section-icon faq">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2>Frequently Asked Questions</h2>
              <p>Common technical, dimensional, and bulk ordering inquiries.</p>
            </div>
          </div>

          {parsedFaq ? (
            <div className="pdp-faq-accordion-list">
              {parsedFaq.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div className={`faq-accordion-item ${isOpen ? "is-open" : ""}`} key={idx}>
                    <button
                      type="button"
                      className="faq-accordion-trigger"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-q-number">Q{idx + 1}</span>
                      <span className="faq-q-text">{item.question}</span>
                      <ChevronDown size={18} className={`faq-chevron ${isOpen ? "rotate" : ""}`} />
                    </button>
                    {isOpen ? (
                      <div
                        className="faq-accordion-body"
                        dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="pdp-section-prose"
              dangerouslySetInnerHTML={{ __html: acf.faqContent }}
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
