import { NextResponse } from "next/server";
import { bridgeFetch, getCustomerToken } from "@/lib/customer-auth";

export async function POST(request) {
  const token = await getCustomerToken();
  if (!token) {
    return NextResponse.json({ message: "Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body?.type === "shipping" ? "shipping" : "billing";
  if (!body?.address || typeof body.address !== "object") {
    return NextResponse.json({ message: "Address details are missing." }, { status: 400 });
  }

  const { ok, status, data } = await bridgeFetch("/auth/update-address", {
    method: "POST",
    token,
    body: { type, address: body.address },
  });

  if (!ok) {
    return NextResponse.json(
      { message: data?.message || "Address could not be saved." },
      { status: status === 200 ? 400 : status },
    );
  }

  return NextResponse.json({ user: data.user, message: `${type === "shipping" ? "Shipping" : "Billing"} address saved.` });
}
