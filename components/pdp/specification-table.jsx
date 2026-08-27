import { Activity, Cog, FileSpreadsheet, Gauge, Info, Layers, Ruler, Wrench } from "lucide-react";
import { decodeHtml, formatAttributeLabel } from "@/lib/utils";

export function SpecificationTable({ product, acf = {} }) {
  const attributes = product?.attributes || [];

  const techRows = [];

  // WooCommerce Global / Custom Attributes
  attributes.forEach((attr) => {
    const label = formatAttributeLabel(attr.name);
    const terms = attr.terms?.map((t) => decodeHtml(t.name)).join(", ") || (Array.isArray(attr.options) ? attr.options.map(decodeHtml).join(", ") : "");
    if (terms) {
      techRows.push({ label, value: terms, isMono: /pitch|size|diameter|grade|tolerance/i.test(label) });
    }
  });

  // ACF Fastener Technical Data
  if (acf.familyModelCode) {
    techRows.push({ label: "Family / Series Code", value: acf.familyModelCode, isMono: true });
  }
  if (acf.threadToleranceClass) {
    techRows.push({ label: "Thread Tolerance / Fit", value: acf.threadToleranceClass, isMono: true });
  }
  if (acf.threadDirection) {
    techRows.push({ label: "Thread Direction", value: acf.threadDirection });
  }
  if (acf.threadCoverage) {
    techRows.push({ label: "Thread Coverage", value: acf.threadCoverage });
  }
  if (acf.recommendedDriverTool) {
    techRows.push({ label: "Recommended Tool", value: acf.recommendedDriverTool });
  }
  if (acf.recommendedTorque) {
    techRows.push({ label: "Recommended Torque", value: acf.recommendedTorque, isMono: true });
  }
  if (acf.standardReferenceNote) {
    techRows.push({ label: "Standard Specification", value: acf.standardReferenceNote });
  }

  const hasTable = Boolean(acf.technicalSpecificationTable);
  const hasRows = techRows.length > 0;
  const hasNotes = Boolean(acf.technicalNotes);

  if (!hasTable && !hasRows && !hasNotes) {
    return null;
  }

  return (
    <section className="pdp-section pdp-technical-specs" id="technical-specifications">
      <div className="pdp-section-header">
        <div className="pdp-section-icon">
          <Cog size={20} />
        </div>
        <div>
          <h2>Technical Specifications & Dimensions</h2>
          <p>Engineered fastener properties, thread tolerances, and tooling standards.</p>
        </div>
      </div>

      {/* Primary Key-Value Specifications Grid */}
      {hasRows ? (
        <div className="fastener-spec-grid">
          {techRows.map((row, idx) => (
            <div className="spec-tile" key={idx}>
              <span className="spec-tile-label">{row.label}</span>
              <strong className={`spec-tile-val ${row.isMono ? "font-mono" : ""}`}>
                {row.value}
              </strong>
            </div>
          ))}
        </div>
      ) : null}

      {/* WYSIWYG Technical Specification / Dimension Table */}
      {hasTable ? (
        <div className="pdp-dimension-table-wrapper">
          <div className="pdp-table-heading">
            <FileSpreadsheet size={16} />
            <span>Dimensional Data & Size Matrix</span>
          </div>
          <div
            className="pdp-responsive-table-content"
            dangerouslySetInnerHTML={{ __html: acf.technicalSpecificationTable }}
          />
        </div>
      ) : null}

      {/* Engineering Technical Notes */}
      {hasNotes ? (
        <div className="pdp-technical-notes-box">
          <div className="notes-header">
            <Info size={15} />
            <strong>Engineering & Application Notes</strong>
          </div>
          <p>{acf.technicalNotes}</p>
        </div>
      ) : null}
    </section>
  );
}
