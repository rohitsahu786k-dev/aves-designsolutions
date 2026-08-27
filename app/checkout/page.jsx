import { CheckoutHandoff } from "@/components/checkout-handoff";

export const metadata = {
  title: "Checkout | screwnet",
  description: "Secure checkout for screwnet industrial fasteners and hardware.",
};

export default function CheckoutPage() {
  return (
    <div className="container">
      <div className="page-hero">
        <span className="eyebrow">Checkout</span>
        <h1>Secure Checkout</h1>
        <p className="muted">Review your order, then continue to payment for verified delivery and GST billing.</p>
      </div>
      <CheckoutHandoff />
    </div>
  );
}
