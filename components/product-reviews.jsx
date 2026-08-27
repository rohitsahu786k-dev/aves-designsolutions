"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, MessageSquare, Send, Star, UserCheck } from "lucide-react";

function StarDisplay({ rating, size = 14 }) {
  return (
    <span className="rev-stars-row" style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          style={{
            fill: s <= Math.round(Number(rating)) ? "#fbbf24" : "none",
            color: s <= Math.round(Number(rating)) ? "#fbbf24" : "#cbd5e1",
          }}
        />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          aria-label={`Rate ${s} star`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer" }}
        >
          <Star
            size={26}
            style={{
              fill: s <= (hover || value) ? "#fbbf24" : "none",
              color: s <= (hover || value) ? "#fbbf24" : "#cbd5e1",
              transition: "all 120ms",
            }}
          />
        </button>
      ))}
      <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: "#334155" }}>
        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hover || value] || "Select rating"}
      </span>
    </div>
  );
}

export function ProductReviews({ product }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", rating: 0, review: "" });

  const productId = product?.id;
  const productAvgRating = Number(product?.average_rating || 0);
  const productReviewCount = Number(product?.review_count || 0);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name.trim()) { setErrorMsg("Please enter your name."); return; }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { setErrorMsg("Please enter a valid email address."); return; }
    if (!form.rating) { setErrorMsg("Please select a star rating."); return; }
    if (!form.review.trim() || form.review.trim().length < 10) { setErrorMsg("Please write at least 10 characters in your review."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name: form.name.trim(),
          email: form.email.trim(),
          rating: form.rating,
          review: form.review.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Your review has been submitted! It will appear after moderation.");
        setForm({ name: "", email: "", rating: 0, review: "" });
        setFormOpen(false);
        // Optimistically add review to list
        setReviews((prev) => [
          {
            id: Date.now(),
            reviewer: form.name,
            rating: form.rating,
            review: form.review,
            date_created: new Date().toISOString(),
            verified: false,
            pending: true,
          },
          ...prev,
        ]);
      } else {
        setErrorMsg(data.error || "Failed to submit. Please try again later.");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Compute metrics
  const reviewsWithRating = reviews.filter((r) => Number(r.rating) > 0);
  const displayAvg = reviewsWithRating.length > 0
    ? (reviewsWithRating.reduce((s, r) => s + Number(r.rating), 0) / reviewsWithRating.length).toFixed(1)
    : productAvgRating > 0 ? productAvgRating.toFixed(1) : null;

  const displayCount = reviews.length || productReviewCount;

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviewsWithRating.forEach((r) => {
    const s = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
    ratingCounts[s] = (ratingCounts[s] || 0) + 1;
  });

  return (
    <section className="product-reviews-section" id="customer-reviews">
      {/* Header */}
      <div className="reviews-header-block">
        <div>
          <span className="eyebrow">CUSTOMER REVIEWS</span>
          <h2>What Buyers Say</h2>
        </div>
        <button
          type="button"
          className="write-review-trigger-btn"
          onClick={() => setFormOpen((v) => !v)}
        >
          <MessageSquare size={15} />
          <span>{formOpen ? "Close" : "Write a Review"}</span>
          {formOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Alerts */}
      {successMsg && <div className="review-alert success">{successMsg}</div>}
      {errorMsg && <div className="review-alert error">{errorMsg}</div>}

      {/* Rating Summary */}
      <div className="reviews-summary-card">
        <div className="rating-score-box">
          <div className="score-number">{displayAvg || "—"}</div>
          {displayAvg && <StarDisplay rating={parseFloat(displayAvg)} size={20} />}
          <small className="score-note">
            {displayCount > 0 ? `Based on ${displayCount} review${displayCount !== 1 ? "s" : ""}` : "No reviews yet"}
          </small>
        </div>

        <div className="rating-bars-box">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const pct = reviewsWithRating.length > 0 ? (count / reviewsWithRating.length) * 100 : 0;
            return (
              <div className="rating-bar-row" key={star}>
                <span className="bar-label">{star}★</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Form */}
      {formOpen && (
        <form onSubmit={handleSubmit} className="review-form-card" noValidate>
          <h3>Share Your Experience</h3>
          <p className="form-subtitle">Help other crafters by sharing what you think about this product.</p>

          <div className="form-field">
            <label>Your Rating *</label>
            <StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>

          <div className="form-grid-two">
            <div className="form-field">
              <label htmlFor="rev-name">Full Name *</label>
              <input
                id="rev-name"
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rev-email">Email Address *</label>
              <input
                id="rev-email"
                type="email"
                required
                placeholder="priya@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <small style={{ fontSize: 11, color: "#94a3b8" }}>Not shown publicly</small>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="rev-text">Your Review * <span style={{ fontWeight: 400, color: "#94a3b8" }}>(min. 10 characters)</span></label>
            <textarea
              id="rev-text"
              rows={4}
              required
              minLength={10}
              placeholder="What did you love about the quality, packaging, or delivery speed?"
              value={form.review}
              onChange={(e) => setForm({ ...form, review: e.target.value })}
            />
            <small style={{ fontSize: 11, color: "#94a3b8" }}>{form.review.length} / 10 characters minimum</small>
          </div>

          <button type="submit" className="submit-review-btn" disabled={submitting}>
            <Send size={15} />
            <span>{submitting ? "Submitting..." : "Submit Review"}</span>
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list-container">
        {loading ? (
          <div className="reviews-loading">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => (
            <div className="review-card-item" key={rev.id}>
              <div className="review-card-top">
                <div className="reviewer-profile">
                  <div className="reviewer-avatar" aria-hidden="true">
                    {(rev.reviewer || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="reviewer-info">
                    <strong className="reviewer-name">{rev.reviewer}</strong>
                    <span className="verified-badge">
                      <CheckCircle2 size={11} />
                      {rev.pending ? "Pending Moderation" : "Verified Buyer"}
                    </span>
                  </div>
                </div>
                <span className="review-date">
                  {new Date(rev.date_created).toLocaleDateString("en-IN", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>

              {Number(rev.rating) > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <StarDisplay rating={rev.rating} size={13} />
                </div>
              )}

              <p className="review-text">{rev.review}</p>
            </div>
          ))
        ) : (
          <div className="no-reviews-box">
            <UserCheck size={26} style={{ color: "#cbd5e1" }} />
            <p>Be the first to review <strong>{product?.name}</strong></p>
            <button type="button" className="write-review-trigger-btn" onClick={() => setFormOpen(true)}>
              <MessageSquare size={14} /> Write a Review
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
