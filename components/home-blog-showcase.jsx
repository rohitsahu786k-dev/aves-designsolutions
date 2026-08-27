import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Clock } from "lucide-react";
import { getAllBlogs } from "@/lib/screwnet-blogs";
import { decodeHtml } from "@/lib/utils";

export function HomeBlogShowcase() {
  const blogs = getAllBlogs().slice(0, 3);

  return (
    <section className="section home-blog-section" style={{ padding: "3rem 0", backgroundColor: "#fff" }}>
      <div className="container">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", gap: "1rem" }}>
          <div>
            <span style={{ color: "#ea580c", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Engineering Knowledge Base
            </span>
            <h2 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: "0.35rem 0 0" }}>
              Fastener Standards & Technical Guides
            </h2>
          </div>
          <Link href="/blog" className="button secondary" style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            View All 25 Guides <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.75rem" }}>
          {blogs.map((blog) => {
            const published = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(blog.publishedAt));
            return (
              <article
                key={blog.slug}
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#fff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <Link href={`/blog/${blog.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ height: "180px", overflow: "hidden", backgroundColor: "#f8fafc" }}>
                    <img src={blog.featuredImage} alt={blog.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                      {blog.category}
                    </span>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "700", lineHeight: "1.4", margin: "0 0 0.5rem", color: "#0f172a" }}>
                      {decodeHtml(blog.title)}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5", margin: "0 0 1rem", flexGrow: 1 }}>
                      {blog.excerpt.slice(0, 110)}...
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <CalendarDays size={13} /> {published}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Clock size={13} /> {blog.readTime}
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
