"use client";

import { FileCheck, PackageCheck, ShieldCheck, Sparkles, Truck, Wrench } from "lucide-react";

export function WhyChooseUs() {
  const features = [
    {
      icon: Truck,
      title: "Pan-India Express Dispatch",
      desc: "Fast freight priority across India with real-time SMS & WhatsApp tracking updates.",
    },
    {
      icon: ShieldCheck,
      title: "DIN & ISO Conformance",
      desc: "Calibrated 6g/6H thread pitch and ISO 898-1 tensile ratings for guaranteed industrial reliability.",
    },
    {
      icon: FileCheck,
      title: "Instant 18% GST Tax Credit",
      desc: "B2B itemized invoice generated with standard HSN codes (7318/7415) for immediate ITC claiming.",
    },
    {
      icon: PackageCheck,
      title: "Heavy-Duty Packaging",
      desc: "Reinforced corrugated master cartons with moisture barriers to ensure zero thread damage in transit.",
    },
  ];

  return (
    <section className="section wooden-why-us-section">
      <div className="container">
        <div className="wooden-why-us-grid">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="wooden-why-card">
                <div className="wooden-why-icon-box">
                  <Icon size={22} />
                </div>
                <h3 className="wooden-why-title">{f.title}</h3>
                <p className="wooden-why-desc">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
