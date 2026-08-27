import { Award, Check, FileCheck, Flag, Globe, Info, ShieldCheck } from "lucide-react";

export function ComplianceSection({ acf = {} }) {
  const complianceBadges = [];

  if (acf.rohsCompliant) {
    complianceBadges.push({ label: "RoHS Compliant", desc: "Hazardous substance free", icon: ShieldCheck, color: "mono" });
  }
  if (acf.reachCompliant) {
    complianceBadges.push({ label: "REACH Compliant", desc: "EU SVHC compliant", icon: ShieldCheck, color: "mono" });
  }
  if (acf.materialCertificateAvailable) {
    complianceBadges.push({ label: "Material Certificate Available", desc: "EN 10204 3.1 / MTC / CoC on request", icon: FileCheck, color: "mono" });
  }
  if (acf.madeInIndia) {
    complianceBadges.push({ label: "Made in India", desc: "Precision domestic manufacturing", icon: Flag, color: "mono" });
  }

  const metaItems = [];
  if (acf.hsnCode) {
    metaItems.push({ label: "HSN Code", value: acf.hsnCode });
  }
  if (acf.countryOfOrigin) {
    metaItems.push({ label: "Country of Origin", value: acf.countryOfOrigin });
  }
  if (acf.standardReferenceNote) {
    metaItems.push({ label: "Manufacturing Standard", value: acf.standardReferenceNote });
  }

  const hasBadges = complianceBadges.length > 0;
  const hasMeta = metaItems.length > 0;
  const hasNotes = Boolean(acf.complianceNotes);

  if (!hasBadges && !hasMeta && !hasNotes) {
    return null;
  }

  return (
    <section className="pdp-section pdp-compliance-section" id="standards-compliance">
      <div className="pdp-section-header">
        <div className="pdp-section-icon compliance">
          <Award size={20} />
        </div>
        <div>
          <h2>Standards, Quality & Compliance</h2>
          <p>Regulatory adherence, test certification and origin identification.</p>
        </div>
      </div>

      {/* Positive Compliance Badges Grid */}
      {hasBadges ? (
        <div className="compliance-badges-grid">
          {complianceBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div className={`compliance-badge-card ${badge.color}`} key={idx}>
                <div className="badge-icon-wrap">
                  <Icon size={18} />
                </div>
                <div className="badge-text-wrap">
                  <strong>{badge.label}</strong>
                  <small>{badge.desc}</small>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Origin, HSN & Reference Metadata Row */}
      {hasMeta ? (
        <div className="compliance-meta-row">
          {metaItems.map((item, idx) => (
            <div className="compliance-meta-pill" key={idx}>
              <span className="meta-pill-label">{item.label}:</span>
              <strong className="meta-pill-val">{item.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {/* Compliance / Certification Notes */}
      {hasNotes ? (
        <div className="compliance-notes-box">
          <Info size={15} />
          <p>{acf.complianceNotes}</p>
        </div>
      ) : null}
    </section>
  );
}
