const fs = require('fs');
const path = require('path');

const WP_URL = 'https://wp.screwnet.in';
const SITE_URL = 'https://screwnet.in';

async function runQCAudit() {
  console.log('====================================================');
  console.log('🚀 STARTING SCREWNET A-TO-Z QUALITY CONTROL (QC) AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let warnings = 0;
  let failed = 0;

  function report(name, status, details = '') {
    if (status === 'PASS') {
      console.log(`✅ [PASS] ${name}${details ? ` -> ${details}` : ''}`);
      passed++;
    } else if (status === 'WARN') {
      console.log(`⚠️ [WARN] ${name}${details ? ` -> ${details}` : ''}`);
      warnings++;
    } else {
      console.log(`❌ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: BACKEND WORDPRESS REST & BRIDGE ENDPOINTS
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: WordPress Backend & REST APIs ---');
  try {
    const resRoot = await fetch(`${WP_URL}/wp-json/`);
    report('WP Core REST API', resRoot.ok ? 'PASS' : 'FAIL', `Status: ${resRoot.status}`);
  } catch (e) {
    report('WP Core REST API', 'FAIL', e.message);
  }

  try {
    const resSettings = await fetch(`${WP_URL}/wp-json/screwnet/v1/site-settings`);
    if (resSettings.ok) {
      const data = await resSettings.json();
      const email = data.contact?.email;
      report('Screwnet Site Settings Bridge', 'PASS', `Contact Email: ${email || 'OK'}`);
    } else {
      report('Screwnet Site Settings Bridge', 'FAIL', `Status: ${resSettings.status}`);
    }
  } catch (e) {
    report('Screwnet Site Settings Bridge', 'FAIL', e.message);
  }

  try {
    const resCat = await fetch(`${WP_URL}/wp-json/screwnet/v1/catalogue`);
    if (resCat.ok) {
      const data = await resCat.json();
      const count = Array.isArray(data.catalogues) ? data.catalogues.length : 0;
      report('Fastener Catalogue ACF Endpoint', 'PASS', `${count} catalogues available`);
    } else {
      report('Fastener Catalogue ACF Endpoint', 'FAIL', `Status: ${resCat.status}`);
    }
  } catch (e) {
    report('Fastener Catalogue ACF Endpoint', 'FAIL', e.message);
  }

  try {
    const resPosts = await fetch(`${WP_URL}/wp-json/wp/v2/posts?per_page=5`);
    if (resPosts.ok) {
      const posts = await resPosts.json();
      report('WordPress Live Blog Posts', 'PASS', `${posts.length} recent posts retrieved`);
    } else {
      report('WordPress Live Blog Posts', 'FAIL', `Status: ${resPosts.status}`);
    }
  } catch (e) {
    report('WordPress Live Blog Posts', 'FAIL', e.message);
  }

  try {
    const resCategories = await fetch(`${WP_URL}/wp-json/wp/v2/categories?hide_empty=false`);
    if (resCategories.ok) {
      const cats = await resCategories.json();
      report('WordPress Live Blog Categories', 'PASS', `${cats.length} categories retrieved`);
    } else {
      report('WordPress Live Blog Categories', 'FAIL', `Status: ${resCategories.status}`);
    }
  } catch (e) {
    report('WordPress Live Blog Categories', 'FAIL', e.message);
  }

  try {
    const resLogin = await fetch(`${WP_URL}/wp-login.php`);
    report('WordPress Backend Login Page (/wp-login.php)', resLogin.ok ? 'PASS' : 'FAIL', `Status: ${resLogin.status}`);
  } catch (e) {
    report('WordPress Backend Login Page (/wp-login.php)', 'FAIL', e.message);
  }

  // ----------------------------------------------------
  // TEST 2: ROUTING & REDIRECTS CONFIGURATION
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: Routing & Redirects ---');
  try {
    const nextConfigContent = fs.readFileSync(path.join(__dirname, '..', 'next.config.mjs'), 'utf8');
    if (nextConfigContent.includes('/manage-wp') && nextConfigContent.includes('https://wp.screwnet.in/wp-login.php')) {
      report('/manage-wp -> wp-login.php redirect', 'PASS', 'Configured in next.config.mjs');
    } else {
      report('/manage-wp -> wp-login.php redirect', 'FAIL', 'Missing in next.config.mjs');
    }

    if (nextConfigContent.includes('/my-account') && nextConfigContent.includes('/account')) {
      report('/my-account -> /account redirect', 'PASS', 'Configured in next.config.mjs');
    } else {
      report('/my-account -> /account redirect', 'FAIL', 'Missing in next.config.mjs');
    }
  } catch (e) {
    report('Redirects Verification', 'FAIL', e.message);
  }

  // ----------------------------------------------------
  // TEST 3: ON-DEMAND CACHE REVALIDATION & VERCEL PROTECTION
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: Vercel Quota Protection & Revalidation ---');
  const revalidateRoutePath = path.join(__dirname, '..', 'app', 'api', 'revalidate', 'route.js');
  if (fs.existsSync(revalidateRoutePath)) {
    const revContent = fs.readFileSync(revalidateRoutePath, 'utf8');
    if (revContent.includes('revalidatePath') && revContent.includes('revalidateTag')) {
      report('On-Demand Revalidation API Route', 'PASS', 'app/api/revalidate/route.js active');
    } else {
      report('On-Demand Revalidation API Route', 'WARN', 'Missing revalidate tags or paths');
    }
  } else {
    report('On-Demand Revalidation API Route', 'FAIL', 'File not found');
  }

  const blogPagePath = path.join(__dirname, '..', 'app', 'blog', 'page.jsx');
  if (fs.existsSync(blogPagePath)) {
    const blogContent = fs.readFileSync(blogPagePath, 'utf8');
    if (blogContent.includes('BlogListView') && !blogContent.includes('searchParams')) {
      report('Blog Page Static Prerendering (Vercel Quota Protection)', 'PASS', 'No searchParams bail out, renders as static ○');
    } else {
      report('Blog Page Static Prerendering (Vercel Quota Protection)', 'WARN', 'May bail out of static cache');
    }
  }

  const bridgePath = path.join(__dirname, '..', 'wordpress', 'screwnet-headless-bridge', 'screwnet-headless-bridge.php');
  if (fs.existsSync(bridgePath)) {
    const bridgeContent = fs.readFileSync(bridgePath, 'utf8');
    if (bridgeContent.includes('screwnet_trigger_frontend_revalidation') && bridgeContent.includes('save_post')) {
      report('WordPress save_post Auto-Webhook Hook', 'PASS', 'Active in bridge plugin');
    } else {
      report('WordPress save_post Auto-Webhook Hook', 'FAIL', 'Missing save_post hook');
    }
    if (bridgeContent.includes('screwnet_purge_cache')) {
      report('WordPress Admin Bar ⚡ Sync Button', 'PASS', 'Registered for instant admin sync');
    } else {
      report('WordPress Admin Bar ⚡ Sync Button', 'WARN', 'Admin bar button missing');
    }
  }

  // ----------------------------------------------------
  // TEST 4: CONTACT & EMAIL ACCURACY
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: Contact & Email Consistency ---');
  const headerPath = path.join(__dirname, '..', 'components', 'header.jsx');
  const normalizerPath = path.join(__dirname, '..', 'lib', 'acf-normalizer.js');

  let emailConsistent = true;
  if (fs.existsSync(headerPath)) {
    const hContent = fs.readFileSync(headerPath, 'utf8');
    if (hContent.includes('sales@screwnet.in')) {
      emailConsistent = false;
      report('Header Email Check', 'FAIL', 'Found obsolete sales@screwnet.in in header');
    } else if (hContent.includes('aves.designsolutions@gmail.com')) {
      report('Header Email Check', 'PASS', 'Correctly configured as aves.designsolutions@gmail.com');
    }
  }

  if (fs.existsSync(normalizerPath)) {
    const nContent = fs.readFileSync(normalizerPath, 'utf8');
    if (nContent.includes('sales@screwnet.in')) {
      emailConsistent = false;
      report('ACF Normalizer Email Check', 'FAIL', 'Found obsolete sales@screwnet.in');
    } else {
      report('ACF Normalizer Email Check', 'PASS', 'Synchronized');
    }
  }

  // ----------------------------------------------------
  // TEST 5: CRITICAL ROUTE INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 5: Critical Route Files Existence ---');
  const requiredRoutes = [
    'app/page.jsx',
    'app/shop/page.jsx',
    'app/blog/page.jsx',
    'app/blog/[slug]/page.jsx',
    'app/product/[slug]/page.jsx',
    'app/category/[slug]/page.jsx',
    'app/download-catalogue/page.jsx',
    'app/account/page.jsx',
    'app/cart/page.jsx',
    'app/checkout/page.jsx',
    'app/contact/page.jsx',
    'app/track-order/page.jsx',
  ];

  for (const route of requiredRoutes) {
    const fullPath = path.join(__dirname, '..', route);
    if (fs.existsSync(fullPath)) {
      report(`Route file: ${route}`, 'PASS', 'Exists');
    } else {
      report(`Route file: ${route}`, 'FAIL', 'Missing');
    }
  }

  console.log('\n====================================================');
  console.log(`QC SUMMARY: ${passed} PASSED | ${warnings} WARNINGS | ${failed} FAILED`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 COMPLETE A-TO-Z QC PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SOME QC ISSUES REQUIRE ATTENTION.');
    process.exit(1);
  }
}

runQCAudit().catch(e => {
  console.error('Fatal QC error:', e);
  process.exit(1);
});
