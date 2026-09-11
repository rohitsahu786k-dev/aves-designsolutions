import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Share2, User, Wrench } from "lucide-react";
import { getFeaturedImage, getPost, getPostCategoryName } from "@/lib/wp";
import { decodeHtml, stripHtml, yoastToMetadata } from "@/lib/utils";

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return yoastToMetadata(post?.yoast_head_json, {
    title: decodeHtml(post?.title?.rendered || "Fastener Technical Guide | screwnet"),
    description: stripHtml(post?.excerpt?.rendered || "Fastener engineering guides and technical resources from screwnet."),
  });
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post)
    return (
      <div className="container page-hero" style={{ paddingTop: "3rem" }}>
        <h1>Article Not Found</h1>
        <Link href="/blog">Back to All Guides</Link>
      </div>
    );

  const image = getFeaturedImage(post);
  const title = decodeHtml(post.title?.rendered || "Post");
  const excerpt = stripHtml(post.excerpt?.rendered || "");
  const published = post.date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.date)) : "";
  const wordCount = stripHtml(post.content?.rendered || "").split(/\s+/).length;
  const readingTime = post.readTime || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  const postUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/blog/${slug}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Read "${title}" on screwnet: ${postUrl}`)}`;

  return (
    <article className="blog-article professional-blog-view" style={{ paddingTop: "2.5rem" }}>
      <div className="container blog-article-header">
        <Link className="blog-back-btn" href="/blog">
          <ArrowLeft size={15} /> Back to Guides
        </Link>
        <span className="eyebrow">{getPostCategoryName(post)}</span>
        <h1>{title}</h1>
        {excerpt ? <p className="blog-subtitle">{excerpt}</p> : null}

        <div className="blog-meta-bar">
          <div className="author-tag">
            <User size={14} /> <span>By {post.authorName || "screwnet Technical Team"}</span>
          </div>
          {published ? (
            <div className="blog-date">
              <CalendarDays size={14} /> {published}
            </div>
          ) : null}
          <div className="reading-time">
            <Clock size={14} /> {readingTime}
          </div>
        </div>
      </div>

      {image ? (
        <div className="container blog-featured" style={{ borderRadius: "12px", overflow: "hidden", maxHeight: "500px" }}>
          <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="blog-hero-img" />
        </div>
      ) : null}

      <div className="container blog-reading-layout">
        <aside className="blog-sticky-sidebar">
          <span className="sidebar-label">Share Guide</span>
          <div className="blog-share-buttons">
            <a href={whatsappShare} target="_blank" rel="noreferrer" className="share-btn whatsapp">
              <Share2 size={14} /> WhatsApp
            </a>
          </div>

          <div className="sidebar-promo">
            <Wrench size={16} />
            <strong>Industrial Fasteners</strong>
            <p>Shop certified self-drilling screws, drywall screws, bolts, and anchors directly from screwnet.</p>
            <Link href="/shop" className="sidebar-shop-btn">
              Explore All Fasteners
            </Link>
          </div>
        </aside>

        <div className="blog-content content" dangerouslySetInnerHTML={{ __html: post.content?.rendered || "" }} />
      </div>

      <div className="container blog-article-footer">
        <Link className="button secondary" href="/blog">
          <ArrowLeft size={16} /> Explore All Fastener Guides
        </Link>
        <Link className="button" href="/shop">
          Shop Screwnet Catalog
        </Link>
      </div>
    </article>
  );
}
