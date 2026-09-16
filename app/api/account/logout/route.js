import { NextResponse } from "next/server";
import { CUSTOMER_TOKEN_COOKIE, customerCookieOptions } from "@/lib/customer-auth";

export async function POST() {
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, "", { ...customerCookieOptions(true), maxAge: 0 });
  return response;
}
