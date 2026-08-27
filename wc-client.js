/**
 * WooCommerce REST API Client Helper
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const config = {
  url: process.env.WOOCOMMERCE_SITE_URL || 'https://slateblue-frog-836232.hostingersite.com',
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  version: process.env.WOOCOMMERCE_API_VERSION || 'wc/v3'
};

if (!config.consumerKey || !config.consumerSecret) {
  throw new Error('Missing WooCommerce API credentials. Set WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET.');
}

const authHeader = 'Basic ' + Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

export async function request(endpoint, method = 'GET', data = null, params = {}) {
  let cleanEndpoint = endpoint.replace(/^\/+/, '');
  if (!cleanEndpoint.startsWith('wp-json/')) {
    if (!cleanEndpoint.startsWith('wc/')) {
      cleanEndpoint = `${config.version}/${cleanEndpoint}`;
    }
    cleanEndpoint = `wp-json/${cleanEndpoint}`;
  }

  const url = new URL(`${config.url.replace(/\/+$/, '')}/${cleanEndpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.append(k, String(v));
    }
  }

  const options = {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url.toString(), options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`WooCommerce API Error (${res.status}): ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

export default {
  config,
  request,
  products: {
    list: (params) => request('products', 'GET', null, params),
    get: (id) => request(`products/${id}`, 'GET'),
    create: (data) => request('products', 'POST', data),
    update: (id, data) => request(`products/${id}`, 'PUT', data),
    delete: (id, force = false) => request(`products/${id}`, 'DELETE', null, { force })
  },
  orders: {
    list: (params) => request('orders', 'GET', null, params),
    get: (id) => request(`orders/${id}`, 'GET'),
    create: (data) => request('orders', 'POST', data),
    update: (id, data) => request(`orders/${id}`, 'PUT', data),
    delete: (id, force = false) => request(`orders/${id}`, 'DELETE', null, { force })
  },
  customers: {
    list: (params) => request('customers', 'GET', null, params),
    get: (id) => request(`customers/${id}`, 'GET'),
    create: (data) => request('customers', 'POST', data),
    update: (id, data) => request(`customers/${id}`, 'PUT', data)
  },
  coupons: {
    list: (params) => request('coupons', 'GET', null, params),
    create: (data) => request('coupons', 'POST', data)
  },
  reports: {
    sales: (params) => request('reports/sales', 'GET', null, params),
    topSellers: (params) => request('reports/top_sellers', 'GET', null, params)
  }
};
