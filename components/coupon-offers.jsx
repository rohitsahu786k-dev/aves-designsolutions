"use client";

import { Check, Copy, Gift, LockKeyhole, Tag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cartSubtotal, couponEligibility, couponTitle } from "@/lib/coupon-utils";

const money = (value) => `Rs. ${Math.ceil(value).toLocaleString("en-IN")}`;

export function CouponOffers({ items = [], appliedCode = "", onApply, compact = false, minOrderValue = 300 }) {
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState("");
  const [draftCode, setDraftCode] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { fetch("/api/coupons").then((response) => response.ok ? response.json() : { coupons: [] }).then((data) => setCoupons(data.coupons || [])).catch(() => setCoupons([])); }, []);
  const manualCode = draftCode ?? appliedCode ?? "";
  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const offers = useMemo(() => coupons.map((coupon) => ({ coupon, ...couponEligibility(coupon, items) })), [coupons, items]);
  const knownApplied = coupons.some((coupon) => coupon.code.toLowerCase() === appliedCode.toLowerCase());

  async function copy(code) {
    await navigator.clipboard?.writeText(code);
    setCopied(code);
    window.setTimeout(() => setCopied(""), 1300);
  }

  function applyValidated(rawCode) {
    if (!onApply) return;
    const code = rawCode.trim();
    if (!code) {
      setError("");
      onApply("");
      return;
    }
    if (subtotal < minOrderValue) {
      setError(`Coupons apply on orders of ${money(minOrderValue)} or more. Add ${money(minOrderValue - subtotal)} more.`);
      return;
    }
    const match = coupons.find((coupon) => coupon.code.toLowerCase() === code.toLowerCase());
    if (!match) {
      setError("This coupon code is not valid.");
      return;
    }
    const { eligible, reason } = couponEligibility(match, items);
    if (!eligible) {
      setError(reason);
      return;
    }
    setError("");
    onApply(match.code);
  }

  function submitManual(event) {
    event.preventDefault();
    applyValidated(manualCode);
  }

  return (
    <section className={`coupon-offers ${compact ? "compact" : ""}`}>
      <div className="coupon-heading"><span><Gift size={17} /> Available offers</span><small>Validated at checkout</small></div>
      {onApply ? <form className="coupon-manual" onSubmit={submitManual}><input value={manualCode} onChange={(event) => { setDraftCode(event.target.value.toUpperCase()); setError(""); }} placeholder="Enter coupon code" aria-label="Coupon code" /><button type="submit" disabled={!manualCode.trim()}>{appliedCode && manualCode.trim().toLowerCase() === appliedCode.toLowerCase() ? "Applied" : "Apply"}</button>{appliedCode ? <button type="button" className="coupon-remove-manual" onClick={() => { setDraftCode(""); setError(""); onApply(""); }} aria-label="Remove coupon"><X size={15} /></button> : null}</form> : null}
      {error ? <p className="coupon-error" role="alert"><LockKeyhole size={14} /> {error}</p> : null}
      {appliedCode && !error && !knownApplied ? <p className="coupon-pending"><Check size={14} /> {appliedCode.toUpperCase()} added. Eligibility will be confirmed at checkout.</p> : null}
      {offers.length ? <div className="coupon-list">
        {offers.map(({ coupon, eligible, reason }) => {
          const applied = appliedCode.toLowerCase() === coupon.code.toLowerCase();
          return (
            <article className={`coupon-ticket ${eligible ? "eligible" : "locked"}`} key={coupon.id}>
              <div className="coupon-icon">{eligible ? <Tag size={17} /> : <LockKeyhole size={16} />}</div>
              <div className="coupon-copy"><strong>{couponTitle(coupon)}</strong><span>{coupon.code.toUpperCase()}</span><small>{reason}</small></div>
              <div className="coupon-actions">
                <button type="button" title="Copy coupon" aria-label={`Copy ${coupon.code}`} onClick={() => copy(coupon.code)}>{copied === coupon.code ? <Check size={15} /> : <Copy size={15} />}</button>
                {onApply ? <button type="button" className="coupon-apply" disabled={!eligible || subtotal < minOrderValue} onClick={() => { setDraftCode(applied ? "" : coupon.code.toUpperCase()); applyValidated(applied ? "" : coupon.code); }}>{applied ? <><X size={13} /> Remove</> : "Apply"}</button> : null}
              </div>
            </article>
          );
        })}
      </div> : <p className="coupon-empty">Enter any store coupon above. Live offer cards appear when coupon access is configured.</p>}
    </section>
  );
}
