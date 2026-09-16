import { NextResponse } from "next/server";
import { CUSTOMER_TOKEN_COOKIE, bridgeFetch, customerCookieOptions, getCustomerToken } from "@/lib/customer-auth";

export async function POST(request) {
  const token = await getCustomerToken();
  if (!token) {
    return NextResponse.json({ message: "Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { ok, status, data } = await bridgeFetch("/auth/update-profile", {
    method: "POST",
    token,
    body: {
      first_name: String(body?.first_name || "").trim(),
      last_name: String(body?.last_name || "").trim(),
      email: String(body?.email || "").trim(),
      current_password: String(body?.current_password || ""),
      new_password: String(body?.new_password || ""),
    },
  });

  if (!ok) {
    return NextResponse.json(
      { message: data?.message || "Profile could not be updated." },
      { status: status === 200 ? 400 : status },
    );
  }

  const response = NextResponse.json({ user: data.user, message: "Profile updated successfully." });
  // Password or email changes rotate the signature, so refresh the stored token
  if (data?.token) {
    response.cookies.set(CUSTOMER_TOKEN_COOKIE, data.token, customerCookieOptions(true));
  }
  return response;
}
