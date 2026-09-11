import { CartView } from "@/components/cart-view";

export const revalidate = 86400;

export const metadata = {
  title: "Cart | screwnet",
  description: "Review your screwnet cart before checkout.",
};

export default function CartPage() {
  return <CartView />;
}
