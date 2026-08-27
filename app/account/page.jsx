import Link from "next/link";
import { WP_URL, wordpressUrl } from "@/lib/wp";
import { AccountFormTabs } from "@/components/account-form-tabs";

export const metadata = {
  title: "My Account | screwnet",
  description: "Sign in or create your screwnet customer account securely.",
};

function hiddenValue(html, name) {
  const pattern = new RegExp(`name=["']${name}["'][^>]*value=["']([^"']+)["']|value=["']([^"']+)["'][^>]*name=["']${name}["']`, "i");
  const match = html.match(pattern);
  return match?.[1] || match?.[2] || "";
}

async function getAccountNonces() {
  const response = await fetch(`${WP_URL}/my-account/`, { next: { revalidate: 0 } }).catch(() => null);
  if (!response?.ok) return {};
  const html = await response.text();
  return {
    login: hiddenValue(html, "woocommerce-login-nonce"),
    register: hiddenValue(html, "woocommerce-register-nonce"),
    registrationEnabled: /woocommerce-form-register|name=["']register["']/i.test(html),
  };
}

export default async function AccountPage() {
  const nonces = await getAccountNonces();
  const accountUrl = wordpressUrl("/my-account/");
  const lostPasswordUrl = wordpressUrl("/my-account/lost-password/");

  return (
    <div className="container account-page-shell">
      <div className="account-hero-header">
        <span className="eyebrow">Customer Portal</span>
        <h1>Account Login</h1>
        <p>Sign in to track orders, manage business shipping addresses, or create your screwnet account.</p>
      </div>

      <AccountFormTabs nonces={nonces} accountUrl={accountUrl} lostPasswordUrl={lostPasswordUrl} />
    </div>
  );
}
