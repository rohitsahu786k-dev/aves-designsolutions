import { WishlistView } from "@/components/wishlist-view";

export const revalidate = 86400;
export const metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return <WishlistView />;
}
