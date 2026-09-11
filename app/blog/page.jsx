import Link from "next/link";
import { BookOpen, CalendarDays, Clock, Tag } from "lucide-react";
import { getFeaturedImage, getPostCategoryName, getPostReadTime, getPostCategories, getPosts } from "@/lib/wp";
import { decodeHtml, stripHtml } from "@/lib/utils";
import { getBlogCategories } from "@/lib/screwnet-blogs";

export const metadata = {
  title: "Fastener Technical Guides & Engineering Blog | screwnet",
  description:
    "Comprehensive engineering articles, fastener selection guides, bolt torque charts, and installation best practices from screwnet.",
};

export const revalidate = 15;

export default async function BlogPage({ searchParams }) {
  const params = await searchParams;
  const selectedCategory = params?.category;

  const [posts, wpCategories] = await Promise.all([
    getPosts(),
    getPostCategories(),
  ]);

  // Use live WordPress categories if available, otherwise local fallback
  const categories =
    Array.isArray(wpCategories) && wpCategories.length > 0
      ? wpCategories.map((c) => ({
          name: decodeHtml(c.name),
          slug: c.slug,
          count: c.count,
          id: c.id,
        }))
      : getBlogCategories();

  const selectedCategoryObj = selectedCategory
    ? categories.find(
        (c) =>
          c.slug?.toLowerCase() === selectedCategory.toLowerCase() ||
          c.name?.toLowerCase() === selectedCategory.toLowerCase()
      )
    : null;

  const filteredPosts = selectedCategoryObj
    ? posts.filter((post) => {
        const catName = getPostCategoryName(post);
        if (catName.toLowerCase() === selectedCategoryObj.name.toLowerCase()) return true;
        if (selectedCategoryObj.id && Array.isArray(post.categories) && post.categories.includes(selectedCategoryObj.id)) {
          return true;
        }
        return false;
      })
    : posts;

  return (
    <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
      <div className="page-hero" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <span className="eyebrow" style={{ color: "#000000", fontWeight: "700" }}>
          screwnet Knowledge Base
        </span>
        <h1 style={{ fontSize: "2.4rem", fontWeight: "900", color: "#000000", margin: "0.5rem 0 0.8rem", letterSpacing: "-0.02em" }}>
          Fastener Technical Guides & Articles
        </h1>
        <p className="muted" style={{ color: "#52525b", fontSize: "1rem", maxWidth: "700px", margin: "0 auto" }}>
          In-depth engineering resources, screw selection charts, bolt grade comparisons, and installation best practices.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2.5rem", justifyContent: "center" }}>
        <Link
          href="/blog"
          className="button"
          style={{
            fontSize: "0.85rem",
            padding: "0.45rem 1rem",
            borderRadius: "6px",
            backgroundColor: !selectedCategory ? "#000000" : "#f4f4f5",
            color: !selectedCategory ? "#ffffff" : "#18181b",
            borderColor: !selectedCategory ? "#000000" : "#e4e4e7",
            textDecoration: "none",
            fontWeight: "600",
            transition: "all 150ms ease",
          }}
        >
          All Guides ({posts.length})
        </Link>
        {categories.map((cat) => {
          const isActive =
            selectedCategory &&
            (selectedCategory.toLowerCase() === (cat.slug || "").toLowerCase() ||
              selectedCategory.toLowerCase() === cat.name.toLowerCase());
          return (
            <Link
              key={cat.id || cat.name}
              href={`/blog?category=${encodeURIComponent(cat.slug || cat.name)}`}
              className="button"
              style={{
                fontSize: "0.85rem",
                padding: "0.45rem 1rem",
                borderRadius: "6px",
                backgroundColor: isActive ? "#000000" : "#f4f4f5",
                color: isActive ? "#ffffff" : "#18181b",
                borderColor: isActive ? "#000000" : "#e4e4e7",
                textDecoration: "none",
                fontWeight: "600",
                transition: "all 150ms ease",
              }}
            >
              {decodeHtml(cat.name)} ({cat.count})
            </Link>
          );
        })}
      </div>

      <div className="blog-grid section" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
        {filteredPosts.map((post) => {
          const image = getFeaturedImage(post) || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
          const published = post.date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(post.date)) : "";
          const categoryName = getPostCategoryName(post);
          const readTime = getPostReadTime(post);
          const rawExcerpt = post.excerpt?.rendered || "";
          const cleanExcerpt = stripHtml(rawExcerpt).slice(0, 130);

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
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ height: "200px", overflow: "hidden", backgroundColor: "#000000", position: "relative" }}>
                  <img
                    src={image}
                    alt={decodeHtml(post.title.rendered)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", top: "10px", left: "10px", backgroundColor: "#000000", color: "#ffffff", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", border: "1px solid rgba(255, 255, 255, 0.25)" }}>
                    {categoryName}
                  </div>
                </div>

                <div style={{ padding: "1.35rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "700", lineHeight: "1.4", margin: "0 0 0.6rem 0", color: "#000000" }}>
                    {decodeHtml(post.title.rendered)}
                  </h2>
                  <p className="muted" style={{ fontSize: "0.875rem", lineHeight: "1.55", margin: "0 0 1.25rem 0", flexGrow: 1, color: "#52525b" }}>
                    {cleanExcerpt}...
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#71717a", borderTop: "1px solid #f4f4f5", paddingTop: "0.85rem", marginTop: "auto" }}>
                    {published ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <CalendarDays size={13} style={{ color: "#000000" }} /> {published}
                      </span>
                    ) : null}
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Clock size={13} style={{ color: "#000000" }} /> {readTime}
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
