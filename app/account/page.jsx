import { AccountDashboard } from "@/components/account-dashboard";
import { AccountFormTabs } from "@/components/account-form-tabs";
import { getCurrentCustomer, getCustomerOrders } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account | screwnet",
  description: "Sign in or create your screwnet customer account securely.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();

  if (customer) {
    const orders = await getCustomerOrders();
    return (
      <div className="container account-page-shell">
        <AccountDashboard customer={customer} orders={orders} />
      </div>
    );
  }

  return (
    <div className="container account-page-shell">
      <div className="account-hero-header">
        <span className="eyebrow">Customer Portal</span>
        <h1>Account Login</h1>
        <p>Sign in to track orders, manage business shipping addresses, or create your screwnet account.</p>
      </div>

      <AccountFormTabs />
    </div>
  );
}
