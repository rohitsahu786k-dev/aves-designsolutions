import { NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/customer-auth";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim();

  if (!email) {
    return NextResponse.json({ message: "Please enter the email address on your account." }, { status: 400 });
  }

  const { ok, status, data } = await bridgeFetch("/auth/lost-password", { method: "POST", body: { email } });
  if (!ok) {
    return NextResponse.json(
      { message: data?.message || "Reset email could not be sent. Please try again." },
      { status: status === 200 ? 400 : status },
    );
  }

  return NextResponse.json({
    message: data?.message || "If an account exists with this email, a reset link has been dispatched.",
  });
}
