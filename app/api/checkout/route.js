import { NextResponse } from "next/server";
import { bridgeFetch, getCustomerToken } from "@/lib/customer-auth";
import { MINIMUM_ORDER_VALUE, fetchStoreProducts, storePrice, wooFetch } from "@/lib/woocommerce";

const REQUIRED_FIELDS = ["first_name", "last_name", "email", "phone", "address_1", "city", "state", "postcode"];

function cleanAddress(source = {}) {
  const address = {};
  [
    "first_name",
    "last_name",
    "company",
    "address_1",
    "address_2",
    "city",
    "state",
    "postcode",
    "country",
    "email",
    "phone",
  ].forEach((field) => {
    if (source[field] != null) address[field] = String(source[field]).trim();
  });
  address.country = address.country || "IN";
  return address;
}

function sanitizeLineItems(items = []) {
  return items
    .map((item) => ({
      product_id: Number(item?.product_id || 0),
      variation_id: Number(item?.variation_id || 0),
      quantity: Math.max(1, Math.min(9999, Number(item?.quantity) || 1)),
    }))
    .filter((item) => item.product_id > 0)
    .slice(0, 50);
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const lineItems = sanitizeLineItems(body?.items);

  if (!lineItems.length) {
    return NextResponse.json({ message: "Your bag is empty." }, { status: 400 });
  }

  const billing = cleanAddress(body?.billing);
  const missing = REQUIRED_FIELDS.filter((field) => !billing[field]);
  if (missing.length) {
    return NextResponse.json({ message: "Please complete all required delivery fields.", fields: missing }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email)) {
    return NextResponse.json({ message: "Please enter a valid email address.", fields: ["email"] }, { status: 400 });
  }
  if (!/^\d{10}$/.test(billing.phone.replace(/\D/g, "").slice(-10))) {
    return NextResponse.json({ message: "Please enter a valid 10-digit mobile number.", fields: ["phone"] }, { status: 400 });
  }
  if (!/^\d{6}$/.test(billing.postcode)) {
    return NextResponse.json({ message: "Please enter a valid 6-digit pincode.", fields: ["postcode"] }, { status: 400 });
  }

  // Price and stock are verified against the store, never trusted from the browser
  const products = await fetchStoreProducts([...new Set(lineItems.map((item) => item.product_id))]);
  if (products === null) {
    return NextResponse.json({ message: "Products could not be verified right now. Please try again." }, { status: 503 });
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const unavailable = lineItems.filter((item) => {
    const product = productMap.get(item.product_id);
    return !product || product.is_in_stock === false || product.is_purchasable === false;
  });
  if (unavailable.length) {
    return NextResponse.json(
      { message: "Some items in your bag are no longer available. Please review your cart." },
      { status: 409 },
    );
  }

  const subtotal = lineItems.reduce(
    (total, item) => total + storePrice(productMap.get(item.product_id)) * item.quantity,
    0,
  );
  if (subtotal < MINIMUM_ORDER_VALUE) {
    return NextResponse.json({ message: `Minimum order value is Rs. ${MINIMUM_ORDER_VALUE}.` }, { status: 400 });
  }

  // Attach the order to the signed-in customer so it shows up in their account
  let customerId = 0;
  const token = await getCustomerToken();
  if (token) {
    const { ok, data } = await bridgeFetch("/auth/me", { token });
    if (ok && data?.user?.id) customerId = Number(data.user.id);
  }

  const shipping = body?.ship_to_different ? cleanAddress(body?.shipping) : { ...billing };
  delete shipping.email;

  const coupon = String(body?.coupon || "").trim().toUpperCase();
  const payload = {
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    set_paid: false,
    status: "processing",
    customer_id: customerId,
    billing,
    shipping,
    line_items: lineItems,
    customer_note: String(body?.customer_note || "").trim().slice(0, 500),
    meta_data: [{ key: "_screwnet_order_source", value: "storefront-checkout" }],
  };
  if (coupon) payload.coupon_lines = [{ code: coupon }];

  let { ok, status, data } = await wooFetch("/orders", { method: "POST", body: payload });

  // An invalid or expired coupon should not block the order
  if (!ok && coupon && /coupon/i.test(data?.message || "")) {
    delete payload.coupon_lines;
    ({ ok, status, data } = await wooFetch("/orders", { method: "POST", body: payload }));
  }

  if (!ok || !data?.id) {
    return NextResponse.json(
      { message: data?.message || "Order could not be placed. Please try again." },
      { status: status && status >= 400 ? status : 502 },
    );
  }

  return NextResponse.json({
    id: data.id,
    number: data.number,
    key: data.order_key,
    total: data.total,
    currency: data.currency,
    status: data.status,
  });
}
