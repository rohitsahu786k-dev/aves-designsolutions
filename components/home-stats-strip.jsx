"use client";

import { CheckCircle2, Clock, FileCheck, Layers, PackageCheck, ShieldCheck, Truck, Wrench } from "lucide-react";

export function HomeStatsStrip() {
  return (
    <div className="home-stats-bar" style={{ backgroundColor: "#000000", borderBottom: "1px solid #27272a", padding: "1.25rem 0" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", alignItems: "center" }}>
          {/* Stat 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "4px", backgroundColor: "#18181b", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", flexShrink: 0 }}>
              <Layers size={18} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#ffffff", fontSize: "0.95rem", fontWeight: "800" }}>5,000+ Fastener Sizes</strong>
              <span style={{ display: "block", color: "#a1a1aa", fontSize: "0.78rem" }}>SS304, Grade 8.8 / 10.9 & Brass</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "4px", backgroundColor: "#18181b", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", flexShrink: 0 }}>
              <Wrench size={18} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#ffffff", fontSize: "0.95rem", fontWeight: "800" }}>DIN & ISO Certified</strong>
              <span style={{ display: "block", color: "#a1a1aa", fontSize: "0.78rem" }}>Calibrated 6g/6H thread fit</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "4px", backgroundColor: "#18181b", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", flexShrink: 0 }}>
              <Truck size={18} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#ffffff", fontSize: "0.95rem", fontWeight: "800" }}>24-48h Express Dispatch</strong>
              <span style={{ display: "block", color: "#a1a1aa", fontSize: "0.78rem" }}>Pan-India delivery with live tracking</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "4px", backgroundColor: "#18181b", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", flexShrink: 0 }}>
              <FileCheck size={18} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#ffffff", fontSize: "0.95rem", fontWeight: "800" }}>Instant GST Tax ITC</strong>
              <span style={{ display: "block", color: "#a1a1aa", fontSize: "0.78rem" }}>18% B2B tax credit guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
