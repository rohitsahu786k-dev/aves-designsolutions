import { AccountPortalView } from "@/components/account-portal-view";
import "@/app/account-portal.css";

export const revalidate = 86400;

export const metadata = {
  title: "My Account & Orders | screwnet Industrial Fasteners",
  description: "Manage your screwnet customer profile, track orders, view invoices, and edit delivery addresses.",
};

export default function AccountPage() {
  return (
    <main className="account-page-main">
      <AccountPortalView />
    </main>
  );
}
