import { NextResponse } from "next/server";
import { getActiveCoupons } from "@/lib/wp-coupons";

export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  return NextResponse.json({ coupons: await getActiveCoupons() });
}
