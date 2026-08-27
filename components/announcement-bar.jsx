"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Info, Sparkles, Tag, X } from "lucide-react";
import { decodeHtml } from "@/lib/utils";

const DISMISSED_KEY_PREFIX = "screwnet_announcement_dismissed_";

export function AnnouncementBar({ announcement }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!announcement || !announcement.text) {
      setDismissed(true);
      return;
    }

    if (!announcement.isDismissible) {
      setDismissed(false);
      return;
    }

    const dismissedKey = `${DISMISSED_KEY_PREFIX}${announcement.id || announcement.text.slice(0, 20)}`;
    const isDismissed = localStorage.getItem(dismissedKey) === "true";
    setDismissed(isDismissed);
  }, [announcement]);

  function handleDismiss() {
    if (!announcement) return;
    const dismissedKey = `${DISMISSED_KEY_PREFIX}${announcement.id || announcement.text.slice(0, 20)}`;
    localStorage.setItem(dismissedKey, "true");
    setDismissed(true);
  }

  if (!announcement || !announcement.text || dismissed) {
    return null;
  }

  return (
    <aside className="announcement-top-bar" role="banner" aria-label="Store Announcement">
      <div className="container announcement-bar-inner">
        <div className="announcement-content-wrap">
          <Info size={14} className="announcement-icon text-white" />
          <span className="announcement-text">{decodeHtml(announcement.text)}</span>

          {announcement.linkUrl ? (
            <Link href={announcement.linkUrl} className="announcement-action-link">
              <span>{announcement.linkLabel || "Shop Now"}</span>
              <ArrowRight size={13} />
            </Link>
          ) : null}
        </div>

        {announcement.isDismissible ? (
          <button
            type="button"
            className="announcement-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
