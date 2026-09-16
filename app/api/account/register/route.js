import { NextResponse } from "next/server";
import { CUSTOMER_TOKEN_COOKIE, bridgeFetch, customerCookieOptions } from "@/lib/customer-auth";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 });
  }

  const { ok, status, data } = await bridgeFetch("/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      first_name: String(body?.first_name || "").trim(),
      last_name: String(body?.last_name || "").trim(),
      phone: String(body?.phone || "").trim(),
    },
  });

  if (!ok || !data?.token) {
    return NextResponse.json(
      { message: data?.message || "Account could not be created. Please try again." },
      { status: status === 200 ? 400 : status },
    );
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, data.token, customerCookieOptions(true));
  return response;
}
