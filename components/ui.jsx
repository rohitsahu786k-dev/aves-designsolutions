import Link from "next/link";

export function Badge({ children }) {
  return <span className="ui-badge">{children}</span>;
}

export function Card({ children, className = "" }) {
  return <div className={`ui-card ${className}`}>{children}</div>;
}

export function SectionHeader({ eyebrow, title, href, action = "View all" }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {href ? <Link className="button secondary" href={href}>{action}</Link> : null}
    </div>
  );
}

export function TrustBar() {
  return (
    <section className="trust-bar">
      <div className="container trust-grid">
        <span>Pan India delivery</span>
        <span>Real WooCommerce stock</span>
        <span>Secure WordPress checkout</span>
        <span>Craft supplies specialists</span>
      </div>
    </section>
  );
}
