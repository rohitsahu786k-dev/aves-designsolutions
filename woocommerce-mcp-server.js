#!/usr/bin/env node

/**
 * WooCommerce Model Context Protocol (MCP) Server
 * Fully compliant with MCP JSON-RPC 2.0 protocol over Stdio.
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env if present
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const SITE_URL = (process.env.WOOCOMMERCE_SITE_URL || 'https://slateblue-frog-836232.hostingersite.com').replace(/\/+$/, '');
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;
const API_VERSION = process.env.WOOCOMMERCE_API_VERSION || 'wc/v3';

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  throw new Error('Missing WooCommerce API credentials. Set WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET.');
}

const authHeader = 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

async function wcRequest(endpoint, method = 'GET', data = null, queryParams = {}) {
  let cleanEndpoint = endpoint.replace(/^\/+/, '');
  if (!cleanEndpoint.startsWith('wp-json/')) {
    if (!cleanEndpoint.startsWith('wc/')) {
      cleanEndpoint = `${API_VERSION}/${cleanEndpoint}`;
    }
    cleanEndpoint = `wp-json/${cleanEndpoint}`;
  }

  const url = new URL(`${SITE_URL}/${cleanEndpoint}`);
  for (const [k, v] of Object.entries(queryParams || {})) {
    if (v !== undefined && v !== null) {
      url.searchParams.append(k, String(v));
    }
  }

  const options = {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'User-Agent': 'Antigravity-WooCommerce-MCP/1.0'
    }
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url.toString(), options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return text;
  }

  if (!res.ok) {
    throw new Error(`WooCommerce API Error (${res.status}): ${json.message || JSON.stringify(json)}`);
  }

  return json;
}

const TOOLS = [
  {
    name: 'wc_get_system_status',
    description: 'Get WooCommerce system environment and configuration diagnostics.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'wc_list_products',
    description: 'List products from WooCommerce store with flexible filtering, pagination, and sorting.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', description: 'Current page of the collection. Default 1.' },
        per_page: { type: 'integer', description: 'Maximum number of items to return (1-100). Default 10.' },
        search: { type: 'string', description: 'Limit results to those matching a string.' },
        status: { type: 'string', enum: ['any', 'draft', 'pending', 'private', 'publish'], description: 'Product status.' },
        type: { type: 'string', enum: ['simple', 'grouped', 'external', 'variable'], description: 'Product type.' },
        category: { type: 'string', description: 'Limit result set to products assigned a specific category ID.' },
        tag: { type: 'string', description: 'Limit result set to products assigned a specific tag ID.' },
        featured: { type: 'boolean', description: 'Limit result set to featured products.' },
        on_sale: { type: 'boolean', description: 'Limit result set to products on sale.' },
        min_price: { type: 'string', description: 'Limit result set to products based on a minimum price.' },
        max_price: { type: 'string', description: 'Limit result set to products based on a maximum price.' },
        stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'], description: 'Limit result set to products with specified stock status.' },
        orderby: { type: 'string', enum: ['date', 'id', 'include', 'title', 'slug', 'price', 'popularity', 'rating'], description: 'Sort collection by object attribute.' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Order sort attribute ascending or descending.' }
      }
    }
  },
  {
    name: 'wc_get_product',
    description: 'Retrieve details of a single product by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Unique product identifier.' }
      },
      required: ['id']
    }
  },
  {
    name: 'wc_create_product',
    description: 'Create a new product in WooCommerce.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product name.' },
        type: { type: 'string', enum: ['simple', 'grouped', 'external', 'variable'], description: 'Product type (default simple).' },
        regular_price: { type: 'string', description: 'Product regular price.' },
        sale_price: { type: 'string', description: 'Product sale price.' },
        description: { type: 'string', description: 'Product description (HTML/text).' },
        short_description: { type: 'string', description: 'Product short description.' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' }
            }
          },
          description: 'List of category objects with id.'
        },
        images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              src: { type: 'string', description: 'Image URL.' },
              name: { type: 'string' },
              alt: { type: 'string' }
            },
            required: ['src']
          },
          description: 'List of image objects.'
        },
        manage_stock: { type: 'boolean', description: 'Manage stock level at product level.' },
        stock_quantity: { type: 'integer', description: 'Stock quantity.' },
        stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'], description: 'Stock status.' },
        status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'], description: 'Product status (default publish).' }
      },
      required: ['name']
    }
  },
  {
    name: 'wc_update_product',
    description: 'Update an existing product by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Unique product identifier.' },
        name: { type: 'string', description: 'Product name.' },
        regular_price: { type: 'string', description: 'Product regular price.' },
        sale_price: { type: 'string', description: 'Product sale price.' },
        description: { type: 'string', description: 'Product description.' },
        short_description: { type: 'string', description: 'Product short description.' },
        manage_stock: { type: 'boolean', description: 'Manage stock level.' },
        stock_quantity: { type: 'integer', description: 'Stock quantity.' },
        stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'] },
        status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'] },
        categories: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' } } } },
        images: { type: 'array', items: { type: 'object', properties: { src: { type: 'string' } } } }
      },
      required: ['id']
    }
  },
  {
    name: 'wc_delete_product',
    description: 'Delete or trash a product by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Unique product identifier.' },
        force: { type: 'boolean', description: 'Whether to permanently delete the product instead of moving to trash.' }
      },
      required: ['id']
    }
  },
  {
    name: 'wc_list_orders',
    description: 'List orders from WooCommerce store with filters.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', description: 'Current page.' },
        per_page: { type: 'integer', description: 'Number of items (1-100).' },
        search: { type: 'string', description: 'Search term.' },
        status: { type: 'string', enum: ['any', 'pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash'] },
        customer: { type: 'integer', description: 'Limit result set to orders assigned a specific customer ID.' },
        after: { type: 'string', description: 'ISO8601 formatted date to filter orders created after.' },
        before: { type: 'string', description: 'ISO8601 formatted date to filter orders created before.' },
        orderby: { type: 'string', enum: ['date', 'id', 'include', 'title', 'slug'] },
        order: { type: 'string', enum: ['asc', 'desc'] }
      }
    }
  },
  {
    name: 'wc_get_order',
    description: 'Retrieve details of an order by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Unique order identifier.' }
      },
      required: ['id']
    }
  },
  {
    name: 'wc_create_order',
    description: 'Create a new order in WooCommerce.',
    inputSchema: {
      type: 'object',
      properties: {
        payment_method: { type: 'string', description: 'Payment method ID.' },
        payment_method_title: { type: 'string', description: 'Payment method title.' },
        set_paid: { type: 'boolean', description: 'Define if the order is already paid.' },
        billing: { type: 'object', description: 'Billing address object (first_name, last_name, email, phone, address_1, city, state, postcode, country).' },
        shipping: { type: 'object', description: 'Shipping address object.' },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'integer' },
              quantity: { type: 'integer' },
              variation_id: { type: 'integer' }
            },
            required: ['product_id', 'quantity']
          },
          description: 'Line items list.'
        },
        status: { type: 'string', enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'] }
      },
      required: ['line_items']
    }
  },
  {
    name: 'wc_update_order',
    description: 'Update an existing order status or details by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Unique order identifier.' },
        status: { type: 'string', enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'] },
        customer_note: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'wc_list_customers',
    description: 'List customers registered in WooCommerce.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        per_page: { type: 'integer' },
        search: { type: 'string' },
        role: { type: 'string', enum: ['all', 'administrator', 'customer', 'subscriber'] }
      }
    }
  },
  {
    name: 'wc_get_customer',
    description: 'Retrieve details of a customer by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer' }
      },
      required: ['id']
    }
  },
  {
    name: 'wc_list_categories',
    description: 'List product categories.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        per_page: { type: 'integer' },
        search: { type: 'string' },
        hide_empty: { type: 'boolean' }
      }
    }
  },
  {
    name: 'wc_create_category',
    description: 'Create a new product category.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Category name.' },
        parent: { type: 'integer', description: 'The ID for the parent of the category.' },
        description: { type: 'string', description: 'Category description.' }
      },
      required: ['name']
    }
  },
  {
    name: 'wc_list_coupons',
    description: 'List discount coupons.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        per_page: { type: 'integer' },
        search: { type: 'string' },
        code: { type: 'string' }
      }
    }
  },
  {
    name: 'wc_create_coupon',
    description: 'Create a new discount coupon.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Coupon code.' },
        discount_type: { type: 'string', enum: ['percent', 'fixed_cart', 'fixed_product'] },
        amount: { type: 'string', description: 'Discount amount.' },
        description: { type: 'string' },
        individual_use: { type: 'boolean' },
        usage_limit: { type: 'integer' }
      },
      required: ['code', 'amount']
    }
  },
  {
    name: 'wc_get_reports_sales',
    description: 'Get sales report / summary metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month', 'last_month', 'year'] },
        date_min: { type: 'string', description: 'YYYY-MM-DD' },
        date_max: { type: 'string', description: 'YYYY-MM-DD' }
      }
    }
  },
  {
    name: 'wc_raw_api_request',
    description: 'Execute an arbitrary WooCommerce REST API v3 request.',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: { type: 'string', description: 'Endpoint path, e.g. "products/tags" or "shipping_methods"' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], description: 'HTTP method (default GET).' },
        queryParams: { type: 'object', description: 'URL query parameters object.' },
        data: { type: 'object', description: 'Request payload body (for POST/PUT).' }
      },
      required: ['endpoint']
    }
  }
];

async function handleToolCall(name, args = {}) {
  switch (name) {
    case 'wc_get_system_status':
      return await wcRequest('system_status', 'GET');
    case 'wc_list_products':
      return await wcRequest('products', 'GET', null, args);
    case 'wc_get_product':
      return await wcRequest(`products/${args.id}`, 'GET');
    case 'wc_create_product':
      return await wcRequest('products', 'POST', args);
    case 'wc_update_product': {
      const { id, ...data } = args;
      return await wcRequest(`products/${id}`, 'PUT', data);
    }
    case 'wc_delete_product':
      return await wcRequest(`products/${args.id}`, 'DELETE', null, { force: args.force });
    case 'wc_list_orders':
      return await wcRequest('orders', 'GET', null, args);
    case 'wc_get_order':
      return await wcRequest(`orders/${args.id}`, 'GET');
    case 'wc_create_order':
      return await wcRequest('orders', 'POST', args);
    case 'wc_update_order': {
      const { id, ...data } = args;
      return await wcRequest(`orders/${id}`, 'PUT', data);
    }
    case 'wc_list_customers':
      return await wcRequest('customers', 'GET', null, args);
    case 'wc_get_customer':
      return await wcRequest(`customers/${args.id}`, 'GET');
    case 'wc_list_categories':
      return await wcRequest('products/categories', 'GET', null, args);
    case 'wc_create_category':
      return await wcRequest('products/categories', 'POST', args);
    case 'wc_list_coupons':
      return await wcRequest('coupons', 'GET', null, args);
    case 'wc_create_coupon':
      return await wcRequest('coupons', 'POST', args);
    case 'wc_get_reports_sales':
      return await wcRequest('reports/sales', 'GET', null, args);
    case 'wc_raw_api_request':
      return await wcRequest(args.endpoint, args.method || 'GET', args.data, args.queryParams);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC stdio handler
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    sendResponse({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' }
    });
    return;
  }

  const { id, method, params } = request;

  if (method === 'initialize') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'woocommerce-mcp-server',
          version: '1.0.0'
        }
      }
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'ping') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {}
    });
    return;
  }

  if (method === 'tools/list') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS
      }
    });
    return;
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    try {
      const resultData = await handleToolCall(toolName, toolArgs);
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof resultData === 'string' ? resultData : JSON.stringify(resultData, null, 2)
            }
          ]
        }
      });
    } catch (err) {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing ${toolName}: ${err.message}`
            }
          ]
        }
      });
    }
    return;
  }

  if (id !== undefined && id !== null) {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    });
  }
});
