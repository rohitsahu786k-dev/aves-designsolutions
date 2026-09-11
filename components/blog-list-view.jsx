"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarDays, Clock } from "lucide-react";
import { decodeHtml, stripHtml } from "@/lib/utils";

function BlogListContent({ initialPosts = [], categories = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const queryCat = searchParams.get("category") || "";
  const [selectedCategory, setSelectedCategory] = useState(queryCat);

  useEffect(() => {
    setSelectedCategory(queryCat);
  }, [queryCat]);

  const handleSelectCategory = (slugOrName) => {
    startTransition(() => {
      setSelectedCategory(slugOrName);
      if (slugOrName) {
        router.replace(`/blog?category=${encodeURIComponent(slugOrName)}`, { scroll: false });
      } else {
        router.replace("/blog", { scroll: false });
      }
    });
  };

  const selectedCategoryObj = selectedCategory
    ? categories.find(
        (c) =>
          c.slug?.toLowerCase() === selectedCategory.toLowerCase() ||
          c.name?.toLowerCase() === selectedCategory.toLowerCase()
      )
    : null;

  const filteredPosts = selectedCategoryObj
    ? initialPosts.filter((post) => {
        const catName = post.categoryName || "";
        if (catName.toLowerCase() === selectedCategoryObj.name.toLowerCase()) return true;
        if (
          selectedCategoryObj.id &&
          Array.isArray(post.categories) &&
          post.categories.includes(selectedCategoryObj.id)
        ) {
          return true;
        }
        return false;
      })
    : initialPosts;

  return (
    <>
      {/* Category Filter Pills (Client-side instant filter - 0 server requests) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "2.5rem",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={() => handleSelectCategory("")}
          className="button"
          style={{
            fontSize: "0.85rem",
            padding: "0.45rem 1rem",
            borderRadius: "6px",
            backgroundColor: !selectedCategory ? "#000000" : "#f4f4f5",
            color: !selectedCategory ? "#ffffff" : "#18181b",
            border: `1px solid ${!selectedCategory ? "#000000" : "#e4e4e7"}`,
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          All Guides ({initialPosts.length})
        </button>
        {categories.map((cat) => {
          const isActive =
            selectedCategory &&
            (selectedCategory.toLowerCase() === (cat.slug || "").toLowerCase() ||
              selectedCategory.toLowerCase() === cat.name.toLowerCase());
          return (
            <button
              type="button"
              key={cat.id || cat.name}
              onClick={() => handleSelectCategory(cat.slug || cat.name)}
              className="button"
              style={{
                fontSize: "0.85rem",
                padding: "0.45rem 1rem",
                borderRadius: "6px",
                backgroundColor: isActive ? "#000000" : "#f4f4f5",
                color: isActive ? "#ffffff" : "#18181b",
                border: `1px solid ${isActive ? "#000000" : "#e4e4e7"}`,
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {decodeHtml(cat.name)} ({cat.count})
            </button>
          );
        })}
      </div>

      {/* Blog Cards Grid */}
      <div
        className="blog-grid section"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.75rem",
          opacity: isPending ? 0.7 : 1,
          transition: "opacity 150ms ease",
        }}
      >
        {filteredPosts.map((post) => {
          const image =
            post.featuredImage ||
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
          const published = post.date
            ? new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date(post.date))
            : "";
          const categoryName = post.categoryName || "Technical Guide";
          const readTime = post.readTime || "5 min read";
          const rawExcerpt = post.excerpt?.rendered || post.excerpt || "";
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
              <Link
                href={`/blog/${post.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    height: "200px",
                    overflow: "hidden",
                    backgroundColor: "#000000",
                    position: "relative",
                  }}
                >
                  <img
                    src={image}
                    alt={decodeHtml(post.title?.rendered || post.title || "Post")}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      backgroundColor: "#000000",
                      color: "#ffffff",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                    }}
                  >
                    {categoryName}
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.35rem",
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      lineHeight: "1.4",
                      margin: "0 0 0.6rem 0",
                      color: "#000000",
                    }}
                  >
                    {decodeHtml(post.title?.rendered || post.title || "Post")}
                  </h2>
                  <p
                    className="muted"
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: "1.55",
                      margin: "0 0 1.25rem 0",
                      flexGrow: 1,
                      color: "#52525b",
                    }}
                  >
                    {cleanExcerpt}...
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "#71717a",
                      borderTop: "1px solid #f4f4f5",
                      paddingTop: "0.85rem",
                      marginTop: "auto",
                    }}
                  >
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
    </>
  );
}

export default function BlogListView({ initialPosts = [], categories = [] }) {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "2rem 0", color: "#71717a" }}>
          Loading guides...
        </div>
      }
    >
      <BlogListContent initialPosts={initialPosts} categories={categories} />
    </Suspense>
  );
}
