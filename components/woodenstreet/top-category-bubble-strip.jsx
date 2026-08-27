"use client";

import Link from "next/link";
import { decodeHtml } from "@/lib/utils";
import { Wrench } from "lucide-react";

export function TopCategoryBubbleStrip({ categories = [] }) {
  const visible = categories
    .filter((c) => c.count > 0 && c.slug !== "uncategorized")
    .slice(0, 10);

  if (visible.length === 0) return null;

  return (
    <div className="wooden-bubble-strip" aria-label="Quick Category Navigation">
      <div className="container">
        <div className="wooden-bubble-track">
          {visible.map((cat) => (
            <Link href={`/category/${cat.slug}`} key={cat.id} className="wooden-bubble-item">
              <div className="wooden-bubble-circle">
                {cat.image?.src ? (
                  <img
                    src={cat.image.src}
                    alt={cat.image.alt || cat.name}
                    className="wooden-bubble-img"
                    loading="eager"
                  />
                ) : (
                  <div className="wooden-bubble-fallback">
                    <Wrench size={22} />
                  </div>
                )}
              </div>
              <span className="wooden-bubble-label">{decodeHtml(cat.name)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
