import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, BookOpen, Tag } from "lucide-react";
import { decodeHtml, stripHtml } from "@/lib/utils";
import { getFeaturedImage, getPostCategoryName, getPostReadTime } from "@/lib/wp";
import { getAllBlogs } from "@/lib/screwnet-blogs";

export function HomeBlogShowcase({ posts = [] }) {
  // Use live WordPress posts if available, otherwise fall back to local blogs
  const displayPosts = posts.length > 0 ? posts.slice(0, 6) : getAllBlogs().slice(0, 6).map((b) => ({
    id: b.slug,
    slug: b.slug,
    title: { rendered: b.title },
    excerpt: { rendered: b.excerpt },
    date: `${b.publishedAt}T09:00:00`,
    category: b.category,
    readTime: b.readTime,
    featuredImage: b.featuredImage,
  }));

  return (
    <section className="section home-blog-section" style={{ padding: "4rem 0", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
      <div className="container">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.75rem", borderRadius: "99px", backgroundColor: "#fff7ed", border: "1px solid #ffedd5", marginBottom: "0.6rem" }}>
              <BookOpen size={13} style={{ color: "#ea580c" }} />
              <span style={{ color: "#ea580c", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Fastener Knowledge Base
              </span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0.2rem 0 0", letterSpacing: "-0.02em" }}>
              Fastener Technical Guides & Engineering Articles
            </h2>
          </div>
          <Link href="/blog" className="button secondary" style={{ fontSize: "0.88rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.6rem 1.25rem", borderRadius: "8px", backgroundColor: "#0f172a", color: "#ffffff", border: "none" }}>
            Explore All Articles <ArrowRight size={15} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.75rem" }}>
          {displayPosts.map((post) => {
            const title = typeof post.title === "object" ? post.title.rendered : post.title;
            const excerptRaw = typeof post.excerpt === "object" ? post.excerpt.rendered : post.excerpt;
            const cleanExcerpt = stripHtml(excerptRaw || "").slice(0, 115);
            const image = getFeaturedImage(post) || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
            const categoryName = getPostCategoryName(post);
            const readTime = getPostReadTime(post);
            const published = post.date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(post.date)) : "";

            return (
              <article
                key={post.id || post.slug}
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
                  transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="wp-blog-card"
              >
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ height: "190px", overflow: "hidden", backgroundColor: "#0f172a", position: "relative" }}>
                    <img
                      src={image}
                      alt={decodeHtml(title)}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                      className="wp-blog-thumb"
                    />
                    <div style={{ position: "absolute", top: "12px", left: "12px", backgroundColor: "#111111", backdropFilter: "blur(6px)", padding: "0.25rem 0.65rem", borderRadius: "6px", color: "#ffffff", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid rgba(255,255,255,0.2)" }}>
                      {categoryName}
                    </div>
                  </div>
                  <div style={{ padding: "1.35rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", lineHeight: "1.4", margin: "0 0 0.6rem", color: "#0f172a" }}>
                      {decodeHtml(title)}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: "1.6", margin: "0 0 1.25rem", flexGrow: 1 }}>
                      {cleanExcerpt}...
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem", marginTop: "auto" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#64748b" }}>
                        <CalendarDays size={14} style={{ color: "#ea580c" }} /> {published}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#64748b" }}>
                        <Clock size={14} style={{ color: "#0284c7" }} /> {readTime}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

