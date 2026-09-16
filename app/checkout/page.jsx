import { CheckoutForm } from "@/components/checkout-form";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout | screwnet",
  description: "Secure checkout for screwnet industrial fasteners and hardware.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  const billing = customer?.billing || {};

  const prefill = {
    first_name: billing.first_name || customer?.first_name || "",
    last_name: billing.last_name || customer?.last_name || "",
    email: billing.email || customer?.email || "",
    phone: billing.phone || "",
    company: billing.company || "",
    address_1: billing.address_1 || "",
    address_2: billing.address_2 || "",
    city: billing.city || "",
    state: billing.state || "",
    postcode: billing.postcode || "",
    country: billing.country || "IN",
  };

  return (
    <div className="container">
      <div className="page-hero">
        <span className="eyebrow">Checkout</span>
        <h1>Secure Checkout</h1>
        <p className="muted">Confirm your delivery details and place the order — no redirects, no account required.</p>
      </div>
      <CheckoutForm prefill={prefill} signedIn={Boolean(customer)} />
    </div>
  );
}
