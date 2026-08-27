import { NextResponse } from "next/server";
import { getPolicyPages } from "@/lib/wp-storefront";

const DEFAULT_POLICIES = [
  { id: "p-privacy", slug: "privacy-policy", label: "Privacy Policy", href: "/pages/privacy-policy" },
  { id: "p-terms", slug: "terms-and-conditions", label: "Terms & Conditions", href: "/pages/terms-and-conditions" },
  { id: "p-shipping", slug: "shipping-policy", label: "Shipping Policy", href: "/pages/shipping-policy" },
  { id: "p-refund", slug: "refund-policy", label: "Returns & Refund Policy", href: "/pages/refund-policy" },
  { id: "p-bulk", slug: "bulk-orders", label: "B2B Bulk Orders", href: "/pages/bulk-orders" },
];

export async function GET() {
  const wpPolicies = await getPolicyPages().catch(() => []);
  const policies = Array.isArray(wpPolicies) && wpPolicies.length > 0 ? wpPolicies : DEFAULT_POLICIES;
  return NextResponse.json({ policies }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
