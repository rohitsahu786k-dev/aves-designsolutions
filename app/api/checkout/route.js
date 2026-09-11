import { NextResponse } from "next/server";

const WC_URL = (process.env.WOOCOMMERCE_SITE_URL || process.env.NEXT_PUBLIC_WP_URL || "https://wp.screwnet.in").replace(/\/$/, "");
const WC_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || "ck_8a5d9687204ddcfed78082e6d880d773ef46909f";
const WC_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || "cs_11b2b4e49864daa8d1029941ce94eb6b188458ba";

function getAuthHeader() {
  return "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const {
      customer,
      address,
      items,
      coupon,
      gst,
      paymentMethod = "cod",
      customerNote = "",
    } = body;

    // 1. Validation
    if (!customer?.fullName?.trim() || !customer?.phone?.trim() || !customer?.email?.trim()) {
      return NextResponse.json({ error: "Please provide your full name, phone number, and email address." }, { status: 400 });
    }

    const phoneClean = customer.phone.replace(/[^0-9+]/g, "");
    if (phoneClean.length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }

    if (!address?.street?.trim() || !address?.city?.trim() || !address?.state?.trim() || !address?.pincode?.trim()) {
      return NextResponse.json({ error: "Please provide a complete delivery address including City, State, and Pincode." }, { status: 400 });
    }

    const pincodeClean = address.pincode.replace(/[^0-9]/g, "");
    if (pincodeClean.length !== 6) {
      return NextResponse.json({ error: "Please enter a valid 6-digit Indian PIN code." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    // Split name into first and last
    const nameParts = customer.fullName.trim().split(" ");
    const firstName = nameParts[0] || customer.fullName.trim();
    const lastName = nameParts.slice(1).join(" ") || "";

    // 2. Prepare line items for WooCommerce
    const lineItems = items.map((item) => {
      const line = {
        product_id: Number(item.productId || item.product?.id),
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
      const variationId = Number(item.variationId || item.variation?.id || 0);
      if (variationId > 0) {
        line.variation_id = variationId;
      }
      return line;
    });

    // 3. Prepare metadata (GST details & custom note)
    const metaData = [];
    if (gst?.number?.trim()) {
      metaData.push({ key: "_billing_gstin", value: gst.number.trim().toUpperCase() });
      metaData.push({ key: "_billing_company", value: gst.companyName?.trim() || "" });
    }
    metaData.push({ key: "_created_via", value: "screwnet-headless-nextjs" });

    // 4. Build WooCommerce order payload
    const orderPayload = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === "cod" ? "Cash on delivery" : "Online Payment",
      set_paid: false,
      status: "processing",
      customer_note: customerNote.trim() || undefined,
      billing: {
        first_name: firstName,
        last_name: lastName,
        company: gst?.companyName?.trim() || "",
        address_1: address.street.trim(),
        address_2: address.landmark?.trim() || "",
        city: address.city.trim(),
        state: address.state.trim(),
        postcode: pincodeClean,
        country: "IN",
        email: customer.email.trim(),
        phone: phoneClean,
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
        company: gst?.companyName?.trim() || "",
        address_1: address.street.trim(),
        address_2: address.landmark?.trim() || "",
        city: address.city.trim(),
        state: address.state.trim(),
        postcode: pincodeClean,
        country: "IN",
      },
      line_items: lineItems,
      meta_data: metaData,
    };

    if (coupon?.code?.trim()) {
      orderPayload.coupon_lines = [{ code: coupon.code.trim().toUpperCase() }];
    }

    // 5. Send order creation request to WooCommerce
    const wcEndpoint = `${WC_URL}/wp-json/wc/v3/orders`;
    const res = await fetch(wcEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("WooCommerce Order Creation Error:", data);
      return NextResponse.json(
        { error: data.message || "Unable to place order in store. Please check your details." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      orderNumber: data.number || data.id,
      orderKey: data.order_key,
      total: data.total,
      currency: data.currency,
      status: data.status,
      customer: {
        name: customer.fullName,
        email: customer.email,
        phone: phoneClean,
      },
      shipping: {
        address: `${address.street}, ${address.landmark ? address.landmark + ", " : ""}${address.city}, ${address.state} - ${pincodeClean}`,
      },
    });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Something went wrong while processing your order." }, { status: 500 });
  }
}
