import { WP_URL, getCategories } from "@/lib/wp";

function authHeaders() {
  const username = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WP_APPLICATION_USERNAME;
  const password = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WP_APPLICATION_PASSWORD;
  if (!username || !password) return {};
  return { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` };
}

const publicStoreOffers = [
  {
    id: "public-freeship",
    code: "FREESHIP",
    description: "Free express shipping on fastener orders above Rs. 3,000",
    discountType: "fixed_cart",
    amount: 0,
    minimumAmount: 3000,
    maximumAmount: 0,
    individualUse: false,
    freeShipping: true,
    excludeSaleItems: false,
    productIds: [],
    excludedProductIds: [],
    categoryIds: [],
    excludedCategoryIds: [],
    categoryNames: [],
    usageLimit: 0,
    usageCount: 0,
    expires: null,
  },
  {
    id: "public-screwnet5",
    code: "SCREWNET5",
    description: "5% off on bulk orders above Rs. 5,000",
    discountType: "percent",
    amount: 5,
    minimumAmount: 5000,
    maximumAmount: 0,
    individualUse: false,
    freeShipping: false,
    excludeSaleItems: false,
    productIds: [],
    excludedProductIds: [],
    categoryIds: [],
    excludedCategoryIds: [],
    categoryNames: [],
    usageLimit: 0,
    usageCount: 0,
    expires: null,
  },
  {
    id: "public-screwnet10",
    code: "SCREWNET10",
    description: "10% off on bulk orders above Rs. 10,000",
    discountType: "percent",
    amount: 10,
    minimumAmount: 10000,
    maximumAmount: 0,
    individualUse: false,
    freeShipping: false,
    excludeSaleItems: false,
    productIds: [],
    excludedProductIds: [],
    categoryIds: [],
    excludedCategoryIds: [],
    categoryNames: [],
    usageLimit: 0,
    usageCount: 0,
    expires: null,
  },
  {
    id: "public-screwnet15",
    code: "SCREWNET15",
    description: "15% off on contractor orders above Rs. 20,000",
    discountType: "percent",
    amount: 15,
    minimumAmount: 20000,
    maximumAmount: 0,
    individualUse: false,
    freeShipping: false,
    excludeSaleItems: false,
    productIds: [],
    excludedProductIds: [],
    categoryIds: [],
    excludedCategoryIds: [],
    categoryNames: [],
    usageLimit: 0,
    usageCount: 0,
    expires: null,
  },
];

export async function getActiveCoupons() {
  const headers = authHeaders();
  if (!headers.Authorization) return publicStoreOffers;

  const response = await fetch(`${WP_URL}/wp-json/wc/v3/coupons?per_page=100`, {
    headers,
    next: { revalidate: 300 },
  }).catch(() => null);
  if (!response?.ok) return publicStoreOffers;

  const [coupons, categories] = await Promise.all([response.json(), getCategories().catch(() => [])]);
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const now = new Date();
  const unique = new Map();

  coupons.forEach((coupon) => {
    if (coupon.date_expires && new Date(coupon.date_expires) < now) return;
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return;
    if (coupon.email_restrictions?.length) return;
    const normalized = {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discount_type,
      amount: Number(coupon.amount || 0),
      minimumAmount: Number(coupon.minimum_amount || 0),
      maximumAmount: Number(coupon.maximum_amount || 0),
      individualUse: Boolean(coupon.individual_use),
      freeShipping: Boolean(coupon.free_shipping),
      excludeSaleItems: Boolean(coupon.exclude_sale_items),
      productIds: coupon.product_ids || [],
      excludedProductIds: coupon.excluded_product_ids || [],
      categoryIds: coupon.product_categories || [],
      excludedCategoryIds: coupon.excluded_product_categories || [],
      categoryNames: (coupon.product_categories || []).map((id) => categoryMap.get(id)).filter(Boolean),
      usageLimit: coupon.usage_limit,
      usageCount: coupon.usage_count || 0,
      expires: coupon.date_expires,
    };
    if (!unique.has(normalized.code) || normalized.id > unique.get(normalized.code).id) unique.set(normalized.code, normalized);
  });

  const liveCoupons = [...unique.values()].sort((a, b) => b.amount - a.amount);
  return liveCoupons.length ? liveCoupons : publicStoreOffers;
}
