"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Check, Info, ShieldAlert } from "lucide-react";

const PROPERTY_CLASSES = [
  {
    grade: "Grade 8.8",
    name: "High Tensile Carbon Steel",
    uts: "800 MPa (N/mm²)",
    yield: "640 MPa (80%)",
    torqueM8: "23 Nm",
    torqueM10: "46 Nm",
    torqueM12: "79 Nm",
    torqueM16: "195 Nm",
    idealFor: "Structural steel, automotive chassis, machinery mounting",
    standard: "ISO 898-1 / DIN 933",
  },
  {
    grade: "Grade 10.9",
    name: "Extra High Tensile Alloy Steel",
    uts: "1,000 MPa (N/mm²)",
    yield: "900 MPa (90%)",
    torqueM8: "34 Nm",
    torqueM10: "68 Nm",
    torqueM12: "117 Nm",
    torqueM16: "285 Nm",
    idealFor: "Heavy commercial vehicles, crane booms, high-load linkages",
    standard: "ISO 898-1 / DIN 931",
  },
  {
    grade: "Grade 12.9",
    name: "Ultra-High Tensile Chrome-Moly",
    uts: "1,220 MPa (N/mm²)",
    yield: "1,080 MPa (90%)",
    torqueM8: "40 Nm",
    torqueM10: "79 Nm",
    torqueM12: "136 Nm",
    torqueM16: "335 Nm",
    idealFor: "Precision tooling, injection molds, engine cylinder heads",
    standard: "DIN 912 / ISO 4762",
  },
  {
    grade: "SS 316 (A4-70)",
    name: "Marine Grade Molybdenum Stainless",
    uts: "700 MPa (N/mm²)",
    yield: "450 MPa",
    torqueM8: "16 Nm",
    torqueM10: "32 Nm",
    torqueM12: "56 Nm",
    torqueM16: "138 Nm",
    idealFor: "Offshore docks, chemical processing, swimming pools, marine hardware",
    standard: "ISO 3506-1 / A4",
  },
];

export function TorqueMatrixWidget() {
  const [selectedGrade, setSelectedGrade] = useState(PROPERTY_CLASSES[0].grade);
  const current = PROPERTY_CLASSES.find((c) => c.grade === selectedGrade) || PROPERTY_CLASSES[0];

  return (
    <section className="section torque-matrix-section" style={{ backgroundColor: "#ffffff", borderTop: "1px solid #e4e4e7", borderBottom: "1px solid #e4e4e7", padding: "3.5rem 0" }}>
      <div className="container">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", gap: "1rem" }}>
          <div>
            <span style={{ color: "#71717a", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Technical Engineering Guide
            </span>
            <h2 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#000000", margin: "0.35rem 0 0" }}>
              Tensile Load & Standard Tightening Torque Matrix
            </h2>
          </div>
          <Link href="/blog/bolt-torque-specifications-tightening-standards" className="button button-outline" style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            Full Torque Calculation Guide <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grade Selector Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {PROPERTY_CLASSES.map((item) => {
            const isSelected = item.grade === selectedGrade;
            return (
              <button
                key={item.grade}
                type="button"
                onClick={() => setSelectedGrade(item.grade)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: isSelected ? "1px solid #000000" : "1px solid #e4e4e7",
                  backgroundColor: isSelected ? "#000000" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#000000",
                  transition: "all 0.15s ease",
                }}
              >
                {item.grade}
              </button>
            );
          })}
        </div>

        {/* Matrix Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {/* Mechanical Specs Panel */}
          <div style={{ backgroundColor: "#fafafa", padding: "1.5rem", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#000000", marginBottom: "1rem" }}>
              {current.grade} — {current.name}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e4e4e7", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#71717a" }}>Ultimate Tensile (UTS):</span>
                <strong style={{ color: "#000000" }}>{current.uts}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e4e4e7", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#71717a" }}>Yield Strength:</span>
                <strong style={{ color: "#000000" }}>{current.yield}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e4e4e7", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#71717a" }}>Governing Standard:</span>
                <strong style={{ color: "#000000" }}>{current.standard}</strong>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ color: "#71717a", display: "block", marginBottom: "0.25rem" }}>Recommended Applications:</span>
                <p style={{ margin: 0, color: "#3f3f46", fontSize: "0.85rem", lineHeight: "1.5" }}>{current.idealFor}</p>
              </div>
            </div>
          </div>

          {/* Tightening Torque Table */}
          <div style={{ backgroundColor: "#fafafa", padding: "1.5rem", borderRadius: "6px", border: "1px solid #e4e4e7" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#000000", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Calculator size={16} style={{ color: "#000000" }} /> Recommended Torque Values (Nm, Dry)
            </h3>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e4e4e7", color: "#71717a" }}>
                  <th style={{ padding: "0.5rem 0" }}>Bolt Size</th>
                  <th style={{ padding: "0.5rem 0" }}>Tightening Torque</th>
                  <th style={{ padding: "0.5rem 0" }}>Condition</th>
                </tr>
              </thead>
              <tbody style={{ color: "#18181b" }}>
                <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
                  <td style={{ padding: "0.5rem 0", fontWeight: "700" }}>M8 × 1.25</td>
                  <td style={{ padding: "0.5rem 0", color: "#000000", fontWeight: "700" }}>{current.torqueM8}</td>
                  <td style={{ padding: "0.5rem 0", color: "#71717a" }}>Zinc Coated / Dry</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
                  <td style={{ padding: "0.5rem 0", fontWeight: "700" }}>M10 × 1.50</td>
                  <td style={{ padding: "0.5rem 0", color: "#000000", fontWeight: "700" }}>{current.torqueM10}</td>
                  <td style={{ padding: "0.5rem 0", color: "#71717a" }}>Zinc Coated / Dry</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
                  <td style={{ padding: "0.5rem 0", fontWeight: "700" }}>M12 × 1.75</td>
                  <td style={{ padding: "0.5rem 0", color: "#000000", fontWeight: "700" }}>{current.torqueM12}</td>
                  <td style={{ padding: "0.5rem 0", color: "#71717a" }}>Zinc Coated / Dry</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.5rem 0", fontWeight: "700" }}>M16 × 2.00</td>
                  <td style={{ padding: "0.5rem 0", color: "#000000", fontWeight: "700" }}>{current.torqueM16}</td>
                  <td style={{ padding: "0.5rem 0", color: "#71717a" }}>Zinc Coated / Dry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
