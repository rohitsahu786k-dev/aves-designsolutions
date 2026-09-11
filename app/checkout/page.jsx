import { NativeCheckoutForm } from "@/components/native-checkout-form";

export const revalidate = 86400;

export const metadata = {
  title: "Checkout | screwnet",
  description: "Secure checkout for screwnet industrial fasteners and hardware.",
};

export default function CheckoutPage() {
  return (
    <div className="container">
      <div className="page-hero">
        <span className="eyebrow">Direct Store Checkout</span>
        <h1>Secure Checkout</h1>
        <p className="muted">Enter your delivery address and contact details for verified Cash on Delivery dispatch.</p>
      </div>
      <NativeCheckoutForm />
    </div>
  );
}
