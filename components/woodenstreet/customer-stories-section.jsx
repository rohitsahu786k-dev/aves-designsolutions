"use client";

import { CheckCircle2, MessageSquareQuote, Star } from "lucide-react";

export function CustomerStoriesSection() {
  const reviews = [
    {
      author: "Rajesh Sharma",
      role: "Solar EPC Contractor, Jaipur",
      review: "Ordered 10,000 pcs of SS304 flanged screws for our rooftop solar project. Zero rusting after monsoons, thread pitch is 100% accurate, and received GST invoice with ITC within 2 minutes of payment.",
      rating: 5,
      date: "Verified Buyer • August 2026",
    },
    {
      author: "Amit Patel",
      role: "Fabrication Workshop Owner, Ahmedabad",
      review: "Grade 12.9 socket head cap screws passed our tensile stress testing flawlessly. Delivery arrived in 36 hours in sturdy industrial boxes with zero thread damage.",
      rating: 5,
      date: "Verified Buyer • August 2026",
    },
    {
      author: "Vikas Kulkarni",
      role: "CNC Machine Manufacturer, Pune",
      review: "The brass knurled inserts and DIN 912 Allen bolts have consistent 6g/6H tolerances. Perfect fit for automated assembly line tools. Highly recommended for OEM bulk orders.",
      rating: 5,
      date: "Verified Buyer • July 2026",
    },
  ];

  return (
    <section className="section wooden-reviews-section">
      <div className="container">
        <div className="wooden-section-header center">
          <div className="wooden-section-tag">
            <MessageSquareQuote size={14} />
            <span>CUSTOMER REVIEWS</span>
          </div>
          <h2 className="wooden-section-title">Trusted by 2,000+ Engineers & Contractors</h2>
          <p className="wooden-section-subtitle">
            See why fabrication workshops, solar EPC builders, and machinery OEMs across India choose screwnet.
          </p>
        </div>

        <div className="wooden-reviews-grid">
          {reviews.map((r, i) => (
            <div key={i} className="wooden-review-card">
              <div className="wooden-review-stars">
                {[...Array(r.rating)].map((_, idx) => (
                  <Star key={idx} size={15} className="fill-black text-black" />
                ))}
              </div>
              <p className="wooden-review-quote">&quot;{r.review}&quot;</p>
              <div className="wooden-review-footer">
                <div className="wooden-review-author-box">
                  <div className="wooden-review-avatar">
                    {r.author.slice(0, 1)}
                  </div>
                  <div>
                    <strong className="wooden-review-author">{r.author}</strong>
                    <span className="wooden-review-role">{r.role}</span>
                  </div>
                </div>
                <span className="wooden-review-verified">
                  <CheckCircle2 size={13} />
                  <span>Verified Purchase</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
