import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export function ProductHighlights({ highlights = [] }) {
  if (!Array.isArray(highlights) || highlights.length === 0) {
    return null;
  }

  return (
    <div className="pdp-highlights-box" aria-label="Key Product Highlights">
      <div className="pdp-highlights-title">
        <Sparkles size={14} className="text-black" />
        <span>Product Highlights</span>
      </div>
      <ul className="pdp-highlights-list">
        {highlights.map((item, index) => {
          const text = item.replace(/^[✓✔•\-\*]\s*/, "").trim();
          if (!text) return null;
          return (
            <li key={index} className="pdp-highlight-item">
              <CheckCircle2 size={15} className="pdp-highlight-check" />
              <span>{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
