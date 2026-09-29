import { getFeaturedImage, getPostCategoryName, getPostReadTime, getPosts } from "@/lib/wp";
import { decodeHtml } from "@/lib/utils";
import BlogListView from "@/components/blog-list-view";

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function postCategoryNames(post) {
  const embedded = (post?._embedded?.["wp:term"] || []).flat().filter((term) => term?.taxonomy === "category");
  const names = embedded.map((term) => decodeHtml(term.name));
  if (names.length) return names;
  return post?.category ? [decodeHtml(post.category)] : [];
}

export const metadata = {
  title: "Fastener Technical Guides & Engineering Blog | screwnet",
  description:
    "Comprehensive engineering articles, fastener selection guides, bolt torque charts, and installation best practices from screwnet.",
};

export const revalidate = 86400;

export default async function BlogPage() {
  const rawPosts = await getPosts();

  // Pre-normalize posts for instant client rendering
  const posts = (rawPosts || []).map((post) => {
    const names = postCategoryNames(post);
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      categorySlugs: names.map(slugify),
      categoryName: decodeHtml(getPostCategoryName(post)),
      readTime: getPostReadTime(post),
      featuredImage: getFeaturedImage(post),
    };
  });

  // Category pills are derived from the posts actually rendered, so a pill can
  // never point at a category that yields an empty list.
  const categoryMap = new Map();
  (rawPosts || []).forEach((post) => {
    postCategoryNames(post).forEach((name) => {
      const slug = slugify(name);
      const entry = categoryMap.get(slug) || { name, slug, count: 0 };
      entry.count += 1;
      categoryMap.set(slug, entry);
    });
  });
  const categories = [...categoryMap.values()]
    .filter((entry) => entry.slug !== "uncategorized")
    .sort((a, b) => b.count - a.count);

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
