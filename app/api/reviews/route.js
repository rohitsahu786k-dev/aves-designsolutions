import { NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://wp.screwnet.in";
const WP_USER = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WP_APPLICATION_USERNAME || process.env.WP_ADMIN_USER || "";
const WP_PASS = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WP_APPLICATION_PASSWORD || process.env.WP_ADMIN_PASSWORD || "";

function authHeaders() {
  if (!WP_USER || !WP_PASS) return {};
  return {
    Authorization: "Basic " + Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64"),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ reviews: [], total: 0 }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/wc/v3/products/reviews?product=${productId}&per_page=50&status=approved`,
      {
        headers: authHeaders(),
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const reviews = data.map((item) => ({
          id: item.id,
          reviewer: item.reviewer || "Anonymous",
          rating: Number(item.rating) || 5,
          review: item.review ? item.review.replace(/<[^>]*>/g, "").trim() : "",
          date_created: item.date_created || new Date().toISOString(),
          verified: item.verified ?? true,
        })).filter((r) => r.review.length > 0);

        return NextResponse.json({ reviews, total: reviews.length });
      }
    }

    const fallbackRes = await fetch(
      `${WP_URL}/wp-json/wp/v2/comments?post=${productId}&per_page=50&status=approved&type=review`,
      { cache: "no-store" }
    );

    if (fallbackRes.ok) {
      const comments = await fallbackRes.json();
      if (Array.isArray(comments) && comments.length > 0) {
        const reviews = comments.map((c) => ({
          id: c.id,
          reviewer: c.author_name || "Verified Buyer",
          rating: c.meta?.rating || 5,
          review: c.content?.rendered?.replace(/<[^>]*>/g, "").trim() || "",
          date_created: c.date || new Date().toISOString(),
          verified: true,
        })).filter((r) => r.review.length > 0);

        return NextResponse.json({ reviews, total: reviews.length });
      }
    }

    return NextResponse.json({ reviews: [], total: 0 });
  } catch (error) {
    console.error("[Reviews API GET]", error.message);
    return NextResponse.json({ reviews: [], total: 0 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, name, email, rating, review } = body;

    if (!productId) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email)) return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    if (!rating || Number(rating) < 1 || Number(rating) > 5) return NextResponse.json({ error: "Rating (1-5) is required." }, { status: 400 });
    if (!review?.trim() || review.trim().length < 10) return NextResponse.json({ error: "Review must be at least 10 characters." }, { status: 400 });

    const payload = {
      product_id: Number(productId),
      reviewer: name.trim(),
      reviewer_email: email.trim(),
      rating: Number(rating),
      review: review.trim(),
      status: "hold",
    };

    const res = await fetch(`${WP_URL}/wp-json/wc/v3/products/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseData = await res.json().catch(() => ({}));

    if (res.ok || res.status === 201) {
      return NextResponse.json({ success: true, review: responseData });
    }

    if (responseData?.code === "woocommerce_rest_product_review_duplicate") {
      return NextResponse.json(
        { error: "You have already submitted a review for this product." },
        { status: 409 }
      );
    }

    console.error("[Reviews API POST]", res.status, responseData);
    return NextResponse.json(
      { error: responseData?.message || "Could not submit review. Please try again." },
      { status: res.status || 500 }
    );
  } catch (error) {
    console.error("[Reviews API POST Error]", error.message);
    return NextResponse.json({ error: "Server error. Please try again later." }, { status: 500 });
  }
}
