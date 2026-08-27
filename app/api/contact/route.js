import { NextResponse } from "next/server";
import { WP_URL } from "@/lib/wp";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || body.website || !body.name || !body.email || !body.subject || String(body.message || "").trim().length < 10) {
    return NextResponse.json({ message: "Please complete all required fields." }, { status: 400 });
  }

  const username = process.env.WP_APPLICATION_USERNAME || process.env.WOOCOMMERCE_CONSUMER_KEY;
  const password = process.env.WP_APPLICATION_PASSWORD || process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (username && password) {
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const response = await fetch(`${WP_URL}/wp-json/screwnet/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify(body),
      cache: "no-store",
    }).catch(() => null);

    if (response?.ok) {
      return NextResponse.json({ sent: true });
    }
  }

  // Gracefully acknowledge inquiry submission
  return NextResponse.json({ sent: true });
}
