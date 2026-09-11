import Link from "next/link";
import { BookOpen, CalendarDays, Clock, Tag } from "lucide-react";
import { getFeaturedImage, getPosts } from "@/lib/wp";
import { decodeHtml, stripHtml } from "@/lib/utils";
import { getBlogCategories } from "@/lib/screwnet-blogs";

export const metadata = {
  title: "Fastener Technical Guides & Engineering Blog | screwnet",
  description: "Comprehensive engineering articles, fastener selection guides, bolt torque charts, and installation best practices from screwnet.",
};

export default async function BlogPage({ searchParams }) {
  const params = await searchParams;
  const selectedCategory = params?.category;
  const posts = await getPosts();
  const categories = getBlogCategories();

  const filteredPosts = selectedCategory
    ? posts.filter((p) => String(p.category || "").toLowerCase() === String(selectedCategory).toLowerCase())
    : posts;

  return (
    <div className="container">
      <div className="page-hero">
        <span className="eyebrow">screwnet Knowledge Base</span>
        <h1>Fastener Technical Guides & Articles</h1>
        <p className="muted">
          In-depth engineering resources, screw selection charts, bolt grade comparisons, and installation best practices.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem", justifyContent: "center" }}>
        <Link
          href="/blog"
          className="button"
          style={{
            fontSize: "0.85rem",
            padding: "0.4rem 0.9rem",
            backgroundColor: !selectedCategory ? "#000000" : "#f4f4f5",
            color: !selectedCategory ? "#ffffff" : "#18181b",
            borderColor: !selectedCategory ? "#000000" : "#e4e4e7",
          }}
        >
          All Guides ({posts.length})
        </Link>
        {categories.map((cat) => {
          const isActive = selectedCategory && selectedCategory.toLowerCase() === cat.name.toLowerCase();
          return (
            <Link
              key={cat.name}
              href={`/blog?category=${encodeURIComponent(cat.name)}`}
              className="button"
              style={{
                fontSize: "0.85rem",
                padding: "0.4rem 0.9rem",
                backgroundColor: isActive ? "#000000" : "#f4f4f5",
                color: isActive ? "#ffffff" : "#18181b",
                borderColor: isActive ? "#000000" : "#e4e4e7",
              }}
            >
              {cat.name} ({cat.count})
            </Link>
          );
        })}
      </div>

      <div className="blog-grid section" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
        {filteredPosts.map((post) => {
          const image = getFeaturedImage(post);
          const published = post.date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(post.date)) : "";
          return (
            <article
              className="post-card"
              key={post.id || post.slug}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #e4e4e7",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#ffffff",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
                {image ? (
                  <div style={{ height: "200px", overflow: "hidden", backgroundColor: "#f4f4f5" }}>
                    <img
                      src={image}
                      alt={decodeHtml(post.title.rendered)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : null}
                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  {post.category ? (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {post.category}
                    </span>
                  ) : null}
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "700", lineHeight: "1.4", margin: "0 0 0.5rem 0", color: "#000000" }}>
                    {decodeHtml(post.title.rendered)}
                  </h2>
                  <p className="muted" style={{ fontSize: "0.875rem", lineHeight: "1.5", margin: "0 0 1rem 0", flexGrow: 1, color: "#52525b" }}>
                    {stripHtml(post.excerpt?.rendered || "").slice(0, 130)}...
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#71717a", borderTop: "1px solid #f4f4f5", paddingTop: "0.75rem" }}>
                    {published ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <CalendarDays size={13} style={{ color: "#000000" }} /> {published}
                      </span>
                    ) : null}
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={13} style={{ color: "#000000" }} /> {post.readTime || "6 min read"}
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
