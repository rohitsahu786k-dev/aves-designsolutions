export function productQueryParams(query = {}) {
  const params = {};

  if (query.orderby) {
    params.orderby = query.orderby;
    if (query.order) {
      params.order = query.order;
    } else if (query.orderby === "price") {
      params.order = "asc";
    } else if (query.orderby === "date" || query.orderby === "popularity" || query.orderby === "rating") {
      params.order = "desc";
    } else if (query.orderby === "menu_order") {
      params.order = "asc";
    }
  } else {
    // Default to WooCommerce WordPress dashboard ordering (menu_order)
    params.orderby = "menu_order";
    params.order = "asc";
  }

  if (query.search) params.search = query.search;
  if (query.on_sale === "true") params.on_sale = "true";
  if (query.min_price) params.min_price = query.min_price;
  if (query.max_price) params.max_price = query.max_price;
  if (query.stock_status === "instock") params["stock_status[]"] = "instock";

  if (query.page) params.page = String(query.page);
  if (query.per_page) params.per_page = String(query.per_page);

  const reserved = new Set(["search", "on_sale", "min_price", "max_price", "orderby", "order", "stock_status", "page", "per_page"]);
  let index = 0;
  Object.entries(query).forEach(([key, value]) => {
    if (reserved.has(key) || !value || !/^[a-z0-9_-]+$/.test(key)) return;
    params[`attributes[${index}][attribute]`] = `pa_${key}`;
    params[`attributes[${index}][slug]`] = String(value);
    index += 1;
  });

  if (index > 1) params.attribute_relation = "and";
  return params;
}
