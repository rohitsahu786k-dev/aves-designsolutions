"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Cpu, FileCheck, Layers, ShieldCheck, Sparkles, Wrench } from "lucide-react";

export function HomeEngineeringStandards() {
  return (
    <section className="section home-engineering-section" style={{ backgroundColor: "#fafafa", borderTop: "1px solid #e4e4e7", borderBottom: "1px solid #e4e4e7", padding: "4rem 0" }}>
      <div className="container">
        <div style={{ maxWidth: "760px", margin: "0 auto 3rem", textAlign: "center" }}>
          <span style={{ color: "#71717a", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Quality Assurance & Certification
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800", color: "#000000", margin: "0.5rem 0 0.75rem", letterSpacing: "-0.02em" }}>
            Industrial Fastener Standards You Can Rely On
          </h2>
          <p style={{ color: "#71717a", fontSize: "0.95rem", lineHeight: "1.6" }}>
            Every batch at screwnet complies with strict DIN & ISO mechanical tolerances, guaranteeing accurate thread pitch, yield strength, and certified corrosion resistance for critical engineering applications.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {/* Card 1: Stainless Steel Metallurgy */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#000000", color: "#ffffff", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <Sparkles size={20} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Metallurgy</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#000000", margin: "0.25rem 0 0.75rem" }}>SS304 & SS316 Marine Stainless</h3>
              <p style={{ color: "#71717a", fontSize: "0.875rem", lineHeight: "1.5", margin: 0 }}>
                18/8 austenitic stainless steel with zero iron oxide rusting. Ideal for solar panel racking, food processing machinery, and coastal architectural installations.
              </p>
            </div>
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f4f4f5", fontSize: "0.8rem", color: "#000000", fontWeight: "600" }}>
              Standard: ISO 3506-1 (A2-70 / A4-80)
            </div>
          </div>

          {/* Card 2: High-Tensile Structural Fasteners */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#000000", color: "#ffffff", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <Wrench size={20} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Strength Classes</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#000000", margin: "0.25rem 0 0.75rem" }}>Grade 8.8, 10.9 & 12.9 Alloy Steel</h3>
              <p style={{ color: "#71717a", fontSize: "0.875rem", lineHeight: "1.5", margin: 0 }}>
                Heat-treated alloy socket head cap screws and hex structural bolts rated up to 1,220 MPa tensile load for heavy machinery, automotive chassis, and PEB structures.
              </p>
            </div>
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f4f4f5", fontSize: "0.8rem", color: "#000000", fontWeight: "600" }}>
              Standard: ISO 898-1 / DIN 912
            </div>
          </div>

          {/* Card 3: Calibrated Thread Fits */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#000000", color: "#ffffff", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <Layers size={20} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precision Fits</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#000000", margin: "0.25rem 0 0.75rem" }}>6g / 6H Metric Thread Tolerance</h3>
              <p style={{ color: "#71717a", fontSize: "0.875rem", lineHeight: "1.5", margin: 0 }}>
                Clean, burr-free threads verified with calibrated Go/No-Go plug and ring gauges to prevent cross-threading and seize during high-speed automated power driving.
              </p>
            </div>
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f4f4f5", fontSize: "0.8rem", color: "#000000", fontWeight: "600" }}>
              Standard: ISO 965 Metric Tolerance
            </div>
          </div>

          {/* Card 4: Full Documentation & GST */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#000000", color: "#ffffff", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <FileCheck size={20} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Documentation</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#000000", margin: "0.25rem 0 0.75rem" }}>MTC 3.1 & Instant GST Credit</h3>
              <p style={{ color: "#71717a", fontSize: "0.875rem", lineHeight: "1.5", margin: 0 }}>
                Receive itemized GST tax invoices immediately on checkout with complete HSN codes (73181500 / 7415) for verified 18% Input Tax Credit. MTC reports available on request.
              </p>
            </div>
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f4f4f5", fontSize: "0.8rem", color: "#000000", fontWeight: "600" }}>
              Standard: EN 10204 3.1 Certified
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
