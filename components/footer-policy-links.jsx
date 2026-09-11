import Link from "next/link";

const POLICIES = [
  { id: "p-privacy", label: "Privacy Policy", href: "/pages/privacy-policy" },
  { id: "p-terms", label: "Terms & Conditions", href: "/pages/terms-and-conditions" },
  { id: "p-shipping", label: "Shipping Policy", href: "/pages/shipping-policy" },
  { id: "p-refund", label: "Returns & Refund Policy", href: "/pages/refund-policy" },
  { id: "p-bulk", label: "B2B Bulk Orders", href: "/pages/b2b-bulk-orders" },
];

export function FooterPolicyLinks() {
  return (
    <>
      {POLICIES.map((page) => (
        <Link prefetch={false} href={page.href} key={page.id}>
          {page.label}
        </Link>
      ))}
    </>
  );
}
