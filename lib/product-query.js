export function productQueryParams(query = {}) {
  const params = {};
  const first = (value) => (Array.isArray(value) ? value[0] : value);

  const orderby = first(query.orderby);
  const order = first(query.order);

  if (orderby) {
    params.orderby = orderby;
    if (order) {
      params.order = order;
    } else if (orderby === "price") {
      params.order = "asc";
    } else if (orderby === "date" || orderby === "popularity" || orderby === "rating") {
      params.order = "desc";
    } else if (orderby === "menu_order") {
      params.order = "asc";
    }
  } else {
    // Default to WooCommerce WordPress dashboard ordering (menu_order)
    params.orderby = "menu_order";
    params.order = "asc";
  }

  if (first(query.search)) params.search = first(query.search);
  if (first(query.on_sale) === "true") params.on_sale = "true";
  if (first(query.min_price)) params.min_price = first(query.min_price);
  if (first(query.max_price)) params.max_price = first(query.max_price);
  if (first(query.stock_status) === "instock") params.stock_status = "instock";

  if (first(query.page)) params.page = String(first(query.page));
  if (first(query.per_page)) params.per_page = String(first(query.per_page));

  const reserved = new Set(["search", "on_sale", "min_price", "max_price", "orderby", "order", "stock_status", "page", "per_page"]);
  let index = 0;
  Object.entries(query).forEach(([key, value]) => {
    value = first(value);
    if (reserved.has(key) || !value || !/^[a-z0-9_-]+$/.test(key)) return;
    params[`attributes[${index}][attribute]`] = `pa_${key}`;
    params[`attributes[${index}][slug]`] = String(value);
    index += 1;
  });

  if (index > 1) params.attribute_relation = "and";
  return params;
}
