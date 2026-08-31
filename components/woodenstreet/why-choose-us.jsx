"use client";

import { FileCheck, Headphones, ShieldCheck, Tag, Truck, Zap } from "lucide-react";

export function WhyChooseUs() {
  const usps = [
    {
      icon: ShieldCheck,
      line1: "ISO 9001:2015",
      line2: "Certified",
    },
    {
      icon: Truck,
      line1: "Pan-India",
      line2: "Delivery",
    },
    {
      icon: Tag,
      line1: "Bulk",
      line2: "Discounts",
    },
    {
      icon: Headphones,
      line1: "Technical",
      line2: "Support",
    },
    {
      icon: FileCheck,
      line1: "GST Invoice",
      line2: "Billing",
    },
    {
      icon: Zap,
      line1: "Express",
      line2: "Dispatch",
    },
  ];

  return (
    <section className="section usp-strip-section">
      <div className="container">
        <div className="usp-strip-card">
          {usps.map((usp, index) => {
            const Icon = usp.icon;
            return (
              <div key={index} className="usp-strip-item">
                <div className="usp-icon-wrap">
                  <Icon size={30} strokeWidth={1.5} />
                </div>
                <div className="usp-text-wrap">
                  <span className="usp-line1">{usp.line1}</span>
                  <span className="usp-line2">{usp.line2}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
