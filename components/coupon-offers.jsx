"use client";

import { Check, Copy, Gift, LockKeyhole, Tag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { couponEligibility, couponTitle } from "@/lib/coupon-utils";

export function CouponOffers({ items = [], appliedCode = "", onApply, compact = false }) {
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState("");
  const [draftCode, setDraftCode] = useState(null);

  useEffect(() => { fetch("/api/coupons").then((response) => response.ok ? response.json() : { coupons: [] }).then((data) => setCoupons(data.coupons || [])).catch(() => setCoupons([])); }, []);
  const manualCode = draftCode ?? appliedCode ?? "";
  const offers = useMemo(() => coupons.map((coupon) => ({ coupon, ...couponEligibility(coupon, items) })), [coupons, items]);
  const knownApplied = coupons.some((coupon) => coupon.code.toLowerCase() === appliedCode.toLowerCase());

  async function copy(code) {
    await navigator.clipboard?.writeText(code);
    setCopied(code);
    window.setTimeout(() => setCopied(""), 1300);
  }

  function submitManual(event) {
    event.preventDefault();
    if (!onApply) return;
    onApply(manualCode.trim());
  }

  return (
    <section className={`coupon-offers ${compact ? "compact" : ""}`}>
      <div className="coupon-heading"><span><Gift size={17} /> Available offers</span><small>WooCommerce validated at checkout</small></div>
      {onApply ? <form className="coupon-manual" onSubmit={submitManual}><input value={manualCode} onChange={(event) => setDraftCode(event.target.value.toUpperCase())} placeholder="Enter coupon code" aria-label="Coupon code" /><button type="submit" disabled={!manualCode.trim()}>{appliedCode && manualCode.trim().toLowerCase() === appliedCode.toLowerCase() ? "Applied" : "Apply"}</button>{appliedCode ? <button type="button" className="coupon-remove-manual" onClick={() => { setDraftCode(""); onApply(""); }} aria-label="Remove coupon"><X size={15} /></button> : null}</form> : null}
      {appliedCode && !knownApplied ? <p className="coupon-pending"><Check size={14} /> {appliedCode.toUpperCase()} added. WooCommerce will confirm eligibility at checkout.</p> : null}
      {offers.length ? <div className="coupon-list">
        {offers.map(({ coupon, eligible, reason }) => {
          const applied = appliedCode.toLowerCase() === coupon.code.toLowerCase();
          return (
            <article className={`coupon-ticket ${eligible ? "eligible" : "locked"}`} key={coupon.id}>
              <div className="coupon-icon">{eligible ? <Tag size={17} /> : <LockKeyhole size={16} />}</div>
              <div className="coupon-copy"><strong>{couponTitle(coupon)}</strong><span>{coupon.code.toUpperCase()}</span><small>{reason}</small></div>
              <div className="coupon-actions">
                <button type="button" title="Copy coupon" aria-label={`Copy ${coupon.code}`} onClick={() => copy(coupon.code)}>{copied === coupon.code ? <Check size={15} /> : <Copy size={15} />}</button>
                {onApply ? <button type="button" className="coupon-apply" disabled={!eligible} onClick={() => { setDraftCode(applied ? "" : coupon.code.toUpperCase()); onApply(applied ? "" : coupon.code); }}>{applied ? <><X size={13} /> Remove</> : "Apply"}</button> : null}
              </div>
            </article>
          );
        })}
      </div> : <p className="coupon-empty">Enter any WooCommerce coupon above. Live offer cards appear when coupon API credentials are configured.</p>}
    </section>
  );
}
