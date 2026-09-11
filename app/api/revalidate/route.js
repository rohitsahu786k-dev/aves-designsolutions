import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handleRevalidation(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || request.headers.get("x-revalidate-secret");

  const validSecret = process.env.REVALIDATE_SECRET || "screwnet_revalidate_secret_2026";
  if (secret !== validSecret) {
    return NextResponse.json({ message: "Invalid secret token" }, { status: 401 });
  }

  const path = searchParams.get("path");
  const slug = searchParams.get("slug");
  const tag = searchParams.get("tag");
  const type = searchParams.get("type"); // 'post', 'product', 'all'
  const redirectTarget = searchParams.get("redirect");

  const revalidated = [];

  try {
    if (tag) {
      revalidateTag(tag);
      revalidated.push(`tag:${tag}`);
    }

    if (path) {
      revalidatePath(path);
      revalidated.push(`path:${path}`);
    }

    if (slug) {
      revalidatePath(`/blog/${slug}`);
      revalidatePath(`/product/${slug}`);
      revalidated.push(`slug:${slug}`);
    }

    if (type === "post" || (!path && !tag && !slug)) {
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]", "page");
      revalidateTag("posts");
      revalidated.push("/blog", "tag:posts");
    }

    if (type === "product" || (!path && !tag && !slug)) {
      revalidatePath("/shop");
      revalidatePath("/product/[slug]", "page");
      revalidateTag("products");
      revalidated.push("/shop", "tag:products");
    }

    if (!path && !tag && !slug) {
      revalidatePath("/");
      revalidatePath("/download-catalogue");
      revalidated.push("/", "/download-catalogue");
    }

    if (redirectTarget === "admin") {
      return NextResponse.redirect(
        new URL("https://wp.screwnet.in/wp-admin/?revalidated=1", request.url)
      );
    }

    return NextResponse.json({
      revalidated: true,
      now: new Date().toISOString(),
      targets: revalidated,
    });
  } catch (err) {
    console.error("Revalidation error:", err);
    return NextResponse.json({ message: "Error revalidating", error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  return handleRevalidation(request);
}

export async function POST(request) {
  return handleRevalidation(request);
}
