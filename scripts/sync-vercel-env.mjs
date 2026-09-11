#!/usr/bin/env node

import fs from 'node:fs';
import { parseEnv } from 'node:util';

const localEnv = parseEnv(fs.readFileSync(process.env.ENV_FILE || '.env.local', 'utf8'));
for (const key of ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID_OR_NAME', 'VERCEL_TEAM_ID']) {
  if (!process.env[key] && localEnv[key]) process.env[key] = localEnv[key];
}

const token = process.env.VERCEL_TOKEN;
const project = process.env.VERCEL_PROJECT_ID_OR_NAME || 'aves-designsolutions';
const teamId = process.env.VERCEL_TEAM_ID || '';
const envFile = process.env.ENV_FILE || '.env.local';

if (!token) {
  throw new Error('Set VERCEL_TOKEN before running this script.');
}

if (!fs.existsSync(envFile)) {
  throw new Error(`${envFile} was not found.`);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
);

const keys = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_WP_URL',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  'NEXT_PUBLIC_SUPPORT_PHONE',
  'NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY',
  'NEXT_PUBLIC_STORE_ADDRESS',
  'NEXT_PUBLIC_WORKING_HOURS',
  'NEXT_PUBLIC_REVALIDATE_SECONDS',
  'WOOCOMMERCE_SITE_URL',
  'WOOCOMMERCE_CONSUMER_KEY',
  'WOOCOMMERCE_CONSUMER_SECRET',
  'WOOCOMMERCE_API_VERSION',
  'WP_APPLICATION_USERNAME',
  'WP_APPLICATION_PASSWORD',
  'WP_AUTH_HEADER',
];

const missing = keys.filter((key) => !env[key]);
if (missing.length) {
  throw new Error(`Missing required env keys in ${envFile}: ${missing.join(', ')}`);
}

const baseUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}`;
const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
const headers = {
  authorization: `Bearer ${token}`,
  'content-type': 'application/json',
};

async function request(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed: ${res.status} ${body?.error?.code || 'unknown_error'}`);
  }

  return body;
}

async function syncEnv() {
  const existing = await request(`${baseUrl}/env${query}`);
  const envs = existing.envs || existing;

  for (const key of keys) {
    const item = envs.find((entry) => entry.key === key && entry.target?.includes('production') && !entry.gitBranch && !entry.customEnvironmentIds?.length);
    await request(`${baseUrl}/env${item ? `/${item.id}` : ''}${query}`, {
      method: item ? 'PATCH' : 'POST',
      body: JSON.stringify({
        ...(item ? {} : { key }),
        value: localEnv[key],
        ...(item ? {} : { type: 'encrypted' }),
        target: item?.type === 'sensitive' ? ['production', 'preview'] : ['production', 'preview', 'development'],
      }),
    });

    if (item?.type === 'sensitive') {
      const development = envs.find((entry) => entry.key === key && entry.target?.includes('development') && !entry.gitBranch);
      await request(`${baseUrl}/env${development ? `/${development.id}` : ''}${query}`, {
        method: development ? 'PATCH' : 'POST',
        body: JSON.stringify({ key, value: localEnv[key], type: 'encrypted', target: ['development'] }),
      });
    }

    console.log(`${key}=synced`);
  }
}

async function addDomain(name) {
  const existing = await request(`${baseUrl}/domains${query}`);
  if (existing.domains?.some((domain) => domain.name === name)) {
    console.log(`${name}=already-added`);
    return;
  }
  try {
    await request(`${baseUrl}/domains${query}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    console.log(`${name}=added`);
  } catch (error) {
    if (String(error.message).includes('already')) {
      console.log(`${name}=already-added`);
      return;
    }

    throw error;
  }
}

await syncEnv();
await addDomain('screwnet.in');
await addDomain('www.screwnet.in');

console.log('Vercel env/domain sync complete.');
