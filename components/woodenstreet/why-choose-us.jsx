"use client";

import { FileCheck, PackageCheck, ShieldCheck, Sparkles, Truck, Wrench } from "lucide-react";

export function WhyChooseUs() {
  const features = [
    {
      icon: Truck,
      title: "Fast Delivery",
      desc: "Dispatch-ready stock with tracking support across India.",
    },
    {
      icon: ShieldCheck,
      title: "Quality Checked",
      desc: "Curated fasteners from trusted grades, finishes, and sizes.",
    },
    {
      icon: FileCheck,
      title: "GST Invoice",
      desc: "Clean billing for retail, trade, and business purchases.",
    },
    {
      icon: PackageCheck,
      title: "Secure Packaging",
      desc: "Packed neatly so products reach you safely and easy to identify.",
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
