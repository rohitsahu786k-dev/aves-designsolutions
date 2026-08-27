import { NextResponse } from "next/server";
import { getActiveCoupons } from "@/lib/wp-coupons";

export async function GET() {
  return NextResponse.json({ coupons: await getActiveCoupons() });
}
