export function productUnitPrice(product) {
  const minor = product?.prices?.currency_minor_unit ?? 2;
  return Number(product?.prices?.price || 0) / Math.pow(10, minor);
}

function itemMatchesScope(item, coupon) {
  const product = item.product || item;
  const categoryIds = (product.categories || []).map((category) => category.id);
  if (coupon.excludedProductIds.includes(product.id)) return false;
  if (categoryIds.some((id) => coupon.excludedCategoryIds.includes(id))) return false;
  if (coupon.excludeSaleItems && product.on_sale) return false;
  const hasProductScope = coupon.productIds.length > 0;
  const hasCategoryScope = coupon.categoryIds.length > 0;
  if (!hasProductScope && !hasCategoryScope) return true;
  return coupon.productIds.includes(product.id) || categoryIds.some((id) => coupon.categoryIds.includes(id));
}

export function cartSubtotal(items = []) {
  return items.reduce((total, item) => total + productUnitPrice(item.product || item) * Number(item.quantity || 1), 0);
}

export function couponEligibility(coupon, items = []) {
  const subtotal = cartSubtotal(items);
  const matchingItems = items.filter((item) => itemMatchesScope(item, coupon));
  if (!matchingItems.length) return { eligible: false, reason: coupon.categoryNames.length ? `Valid on ${coupon.categoryNames.join(", ")}` : "Not valid for these products", subtotal, matchingItems };
  if (coupon.minimumAmount && subtotal < coupon.minimumAmount) return { eligible: false, reason: `Add Rs. ${Math.ceil(coupon.minimumAmount - subtotal).toLocaleString("en-IN")} more`, subtotal, matchingItems };
  if (coupon.maximumAmount && subtotal > coupon.maximumAmount) return { eligible: false, reason: `Valid up to Rs. ${coupon.maximumAmount.toLocaleString("en-IN")}`, subtotal, matchingItems };
  return { eligible: true, reason: coupon.freeShipping ? "Free shipping unlocked" : "Eligible for this order", subtotal, matchingItems };
}

export function couponDiscount(coupon, items = []) {
  const eligibility = couponEligibility(coupon, items);
  if (!eligibility.eligible) return 0;
  const eligibleSubtotal = cartSubtotal(eligibility.matchingItems);
  if (coupon.discountType === "percent") return eligibleSubtotal * (coupon.amount / 100);
  if (coupon.discountType === "fixed_product") return Math.min(eligibleSubtotal, coupon.amount * eligibility.matchingItems.reduce((count, item) => count + Number(item.quantity || 1), 0));
  if (coupon.discountType === "fixed_cart") return Math.min(eligibility.subtotal, coupon.amount);
  return 0;
}

export function couponTitle(coupon) {
  if (coupon.freeShipping && !coupon.amount) return "Free shipping";
  if (coupon.discountType === "percent") return `${coupon.amount}% off`;
  return `Rs. ${coupon.amount.toLocaleString("en-IN")} off`;
}
