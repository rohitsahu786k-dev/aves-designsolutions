import { getFeaturedImage, getPostCategoryName, getPostReadTime, getPostCategories, getPosts } from "@/lib/wp";
import { decodeHtml } from "@/lib/utils";
import { getBlogCategories } from "@/lib/screwnet-blogs";
import BlogListView from "@/components/blog-list-view";

export const metadata = {
  title: "Fastener Technical Guides & Engineering Blog | screwnet",
  description:
    "Comprehensive engineering articles, fastener selection guides, bolt torque charts, and installation best practices from screwnet.",
};

export const revalidate = 86400;

export default async function BlogPage() {
  const [rawPosts, wpCategories] = await Promise.all([
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

  // Pre-normalize posts for instant client rendering
  const posts = (rawPosts || []).map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    categories: post.categories,
    categoryName: getPostCategoryName(post),
    readTime: getPostReadTime(post),
    featuredImage: getFeaturedImage(post),
  }));

  return (
    <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
      <div className="page-hero" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <span className="eyebrow" style={{ color: "#000000", fontWeight: "700" }}>
          screwnet Knowledge Base
        </span>
        <h1
          style={{
            fontSize: "2.4rem",
            fontWeight: "900",
            color: "#000000",
            margin: "0.5rem 0 0.8rem",
            letterSpacing: "-0.02em",
          }}
        >
          Fastener Technical Guides & Articles
        </h1>
        <p
          className="muted"
          style={{
            color: "#52525b",
            fontSize: "1rem",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          In-depth engineering resources, screw selection charts, bolt grade comparisons, and installation best practices.
        </p>
      </div>

      <BlogListView initialPosts={posts} categories={categories} />
    </div>
  );
}
