import { NextResponse } from "next/server";
import { MINIMUM_ORDER_VALUE, bridgeAuthFetch, fetchStoreProducts, storePrice, wooFetch } from "@/lib/woocommerce";

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
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
    const lineItems = items
      .map((item) => {
        const line = {
          product_id: Number(item.productId || item.product?.id || 0),
          quantity: Math.max(1, Math.min(9999, Number(item.quantity) || 1)),
        };
        const variationId = Number(item.variationId || item.variation?.id || 0);
        if (variationId > 0) {
          line.variation_id = variationId;
        }
        return line;
      })
      .filter((line) => line.product_id > 0)
      .slice(0, 50);

    if (!lineItems.length) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    // 3. Re-check stock and order value against the store; the browser is not trusted
    const products = await fetchStoreProducts([...new Set(lineItems.map((line) => line.product_id))]);
    if (products === null) {
      return NextResponse.json({ error: "Products could not be verified right now. Please try again." }, { status: 503 });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const unavailable = lineItems.some((line) => {
      const product = productMap.get(line.product_id);
      return !product || product.is_in_stock === false || product.is_purchasable === false;
    });
    if (unavailable) {
      return NextResponse.json(
        { error: "Some items in your bag are no longer available. Please review your cart." },
        { status: 409 },
      );
    }

    const subtotal = lineItems.reduce(
      (total, line) => total + storePrice(productMap.get(line.product_id)) * line.quantity,
      0,
    );
    if (subtotal < MINIMUM_ORDER_VALUE) {
      return NextResponse.json({ error: `Minimum order value is Rs. ${MINIMUM_ORDER_VALUE}.` }, { status: 400 });
    }

    // 4. Attach the order to the signed-in customer, when the portal sent its token
    const bearer = request.headers.get("authorization") || "";
    const token = bearer.replace(/^Bearer\s+/i, "").trim();
    let customerId = 0;
    if (token) {
      const { ok, data } = await bridgeAuthFetch("/auth/me", { token });
      if (ok && data?.user?.id) customerId = Number(data.user.id);
    }

    // 5. Prepare metadata (GST details & custom note)
    const metaData = [];
    if (gst?.number?.trim()) {
      metaData.push({ key: "_billing_gstin", value: gst.number.trim().toUpperCase() });
      metaData.push({ key: "_billing_company", value: gst.companyName?.trim() || "" });
    }
    metaData.push({ key: "_created_via", value: "screwnet-headless-nextjs" });

    // 6. Build WooCommerce order payload
    const orderPayload = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === "cod" ? "Cash on delivery" : "Online Payment",
      set_paid: false,
      status: "processing",
      customer_id: customerId,
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

    // 7. Create the order in WooCommerce
    let { ok, status, data } = await wooFetch("/orders", { method: "POST", body: orderPayload });

    // An invalid or expired coupon should not block the order
    if (!ok && orderPayload.coupon_lines && /coupon/i.test(data?.message || "")) {
      delete orderPayload.coupon_lines;
      ({ ok, status, data } = await wooFetch("/orders", { method: "POST", body: orderPayload }));
    }

    if (!ok || !data?.id) {
      console.error("WooCommerce Order Creation Error:", data);
      return NextResponse.json(
        { error: data?.message || "Unable to place order in store. Please check your details." },
        { status: status && status >= 400 ? status : 502 },
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
