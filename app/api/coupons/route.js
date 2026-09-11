import { NextResponse } from "next/server";
import { getActiveCoupons } from "@/lib/wp-coupons";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const coupons = await getActiveCoupons();
  return NextResponse.json({ coupons }, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
