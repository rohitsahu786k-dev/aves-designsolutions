import { NextResponse } from "next/server";
import { CUSTOMER_TOKEN_COOKIE, bridgeFetch, customerCookieOptions } from "@/lib/customer-auth";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");

  if (!username || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const { ok, status, data } = await bridgeFetch("/auth/login", {
    method: "POST",
    body: { username, password },
  });

  if (!ok || !data?.token) {
    return NextResponse.json(
      { message: data?.message || "Invalid email or password." },
      { status: status === 200 ? 401 : status },
    );
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, data.token, customerCookieOptions(body?.remember !== false));
  return response;
}
