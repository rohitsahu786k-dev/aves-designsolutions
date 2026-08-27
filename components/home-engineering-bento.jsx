"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Check, Cog, Cpu, FileText, Layers, ShieldCheck, Wrench } from "lucide-react";

const TORQUE_SPECS = [
  { grade: "Grade 8.8", uts: "800 MPa", yield: "640 MPa", m8: "23 Nm", m10: "46 Nm", m12: "79 Nm", app: "Structural steel & chassis" },
  { grade: "Grade 10.9", uts: "1000 MPa", yield: "900 MPa", m8: "34 Nm", m10: "68 Nm", m12: "117 Nm", app: "Heavy commercial & linkage" },
  { grade: "Grade 12.9", uts: "1220 MPa", yield: "1080 MPa", m8: "40 Nm", m10: "79 Nm", m12: "136 Nm", app: "Precision molds & cylinder heads" },
  { grade: "SS 304 / 316", uts: "700 MPa", yield: "450 MPa", m8: "16 Nm", m10: "32 Nm", m12: "56 Nm", app: "Marine & coastal hardware" },
];

const FASTENER_TYPES = [
  { id: "allen-socket", name: "Allen Socket Head", din: "DIN 912", spec: "Grade 12.9 / SS304 • M3-M24", href: "/shop?search=allen" },
  { id: "csk-screw", name: "Countersunk (CSK)", din: "DIN 7991", spec: "Flush 90° Head • M3-M16", href: "/shop?search=csk" },
  { id: "hex-bolt", name: "Structural Hex Bolts", din: "DIN 933", spec: "Grade 8.8 / 10.9 Zinc & HDG", href: "/shop?search=bolt" },
  { id: "flanged-combo", name: "Flanged Combination", din: "SS 304", spec: "Integrated Washer Flange", href: "/shop?search=flanged" },
  { id: "dome-nuts", name: "Dome / Cap Nuts", din: "DIN 1587", spec: "Protective Acorn Cap SS304", href: "/shop?search=dome" },
  { id: "brass-inserts", name: "Brass Threaded Inserts", din: "CNC Knurl", spec: "Heat-Set & Ultrasonic M2-M8", href: "/shop?search=insert" },
];

export function HomeEngineeringBento() {
  const [selectedGrade, setSelectedGrade] = useState("Grade 8.8");
  const currentTorque = TORQUE_SPECS.find((t) => t.grade === selectedGrade) || TORQUE_SPECS[0];

  return (
    <section className="section home-bento-section" style={{ padding: "3.5rem 0", backgroundColor: "#ffffff" }}>
      <div className="container">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", gap: "1rem" }}>
          <div>
            <span style={{ color: "#71717a", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              TECHNICAL ENGINEERING SUITE
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#000000", margin: "0.35rem 0 0", letterSpacing: "-0.02em" }}>
              Precision Fastener Specifications & Torque Guide
            </h2>
          </div>
          <Link href="/blog/bolt-torque-specifications-tightening-standards" className="view-all-link">
            <span>Read Calculation Manual</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Bento Box 1: Tensile Strength & Torque Matrix */}
          <div style={{ backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "4px", backgroundColor: "#000000", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calculator size={17} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#000000", margin: 0 }}>Tightening Torque Matrix</h3>
              </div>

              {/* Grade Selector */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                {TORQUE_SPECS.map((t) => (
                  <button
                    key={t.grade}
                    type="button"
                    onClick={() => setSelectedGrade(t.grade)}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      border: selectedGrade === t.grade ? "1px solid #000000" : "1px solid #e4e4e7",
                      backgroundColor: selectedGrade === t.grade ? "#000000" : "#ffffff",
                      color: selectedGrade === t.grade ? "#ffffff" : "#000000",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {t.grade}
                  </button>
                ))}
              </div>

              {/* Specs Summary Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "0.85rem", marginBottom: "1rem" }}>
                <div>
                  <small style={{ color: "#71717a", fontSize: "0.72rem", textTransform: "uppercase", display: "block" }}>Ultimate Tensile (UTS)</small>
                  <strong style={{ color: "#000000", fontSize: "0.95rem" }}>{currentTorque.uts}</strong>
                </div>
                <div>
                  <small style={{ color: "#71717a", fontSize: "0.72rem", textTransform: "uppercase", display: "block" }}>Yield Strength</small>
                  <strong style={{ color: "#000000", fontSize: "0.95rem" }}>{currentTorque.yield}</strong>
                </div>
              </div>

              {/* Torque Table */}
              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e4e4e7", color: "#71717a" }}>
                    <th style={{ padding: "0.4rem 0" }}>Bolt Thread</th>
                    <th style={{ padding: "0.4rem 0" }}>Tightening Torque</th>
                    <th style={{ padding: "0.4rem 0" }}>Condition</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#000000" }}>
                  <tr style={{ borderBottom: "1px solid #f4f4f5" }}>
                    <td style={{ padding: "0.45rem 0", fontWeight: "700" }}>M8 × 1.25</td>
                    <td style={{ padding: "0.45rem 0", fontWeight: "800", color: "#000000" }}>{currentTorque.m8}</td>
                    <td style={{ padding: "0.45rem 0", color: "#71717a" }}>Dry / As-received</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f4f4f5" }}>
                    <td style={{ padding: "0.45rem 0", fontWeight: "700" }}>M10 × 1.50</td>
                    <td style={{ padding: "0.45rem 0", fontWeight: "800", color: "#000000" }}>{currentTorque.m10}</td>
                    <td style={{ padding: "0.45rem 0", color: "#71717a" }}>Dry / As-received</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.45rem 0", fontWeight: "700" }}>M12 × 1.75</td>
                    <td style={{ padding: "0.45rem 0", fontWeight: "800", color: "#000000" }}>{currentTorque.m12}</td>
                    <td style={{ padding: "0.45rem 0", color: "#71717a" }}>Dry / As-received</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e4e4e7", fontSize: "0.78rem", color: "#71717a" }}>
              Application: <strong>{currentTorque.app}</strong>
            </div>
          </div>

          {/* Bento Box 2: Quick Fastener Selector */}
          <div style={{ backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "4px", backgroundColor: "#000000", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={17} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#000000", margin: 0 }}>Fastener Engineering Selector</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.6rem" }}>
                {FASTENER_TYPES.map((type) => (
                  <Link
                    key={type.id}
                    href={type.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "6px",
                      padding: "0.65rem 0.85rem",
                      textDecoration: "none",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", backgroundColor: "#f4f4f5", padding: "1px 5px", borderRadius: "2px", marginRight: "6px" }}>
                        {type.din}
                      </span>
                      <strong style={{ fontSize: "0.88rem", color: "#000000" }}>{type.name}</strong>
                      <span style={{ display: "block", color: "#71717a", fontSize: "0.75rem", marginTop: "2px" }}>{type.spec}</span>
                    </div>
                    <ArrowRight size={14} style={{ color: "#71717a" }} />
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", color: "#71717a" }}>Looking for custom CNC sizes?</span>
              <Link href="/contact" style={{ fontSize: "0.78rem", fontWeight: "700", color: "#000000", textDecoration: "underline" }}>
                Request Custom RFQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
