# screwnet — Industrial Fasteners & Screws Store

High-performance, SEO-first Next.js storefront for industrial screws, bolts, self-drilling Tek screws, drywall fasteners, anchors, and hardware backed by WooCommerce.

## Features

- **Rebranded Experience**: Minimalist, industrial branding inspired by `onlyscrews.in` with bold typography.
- **25+ Technical SEO Fastener Guides**: Comprehensive engineering blogs covering drill points, torque specs, concrete anchors, stainless steel grades (SS 304 vs 316), and coatings.
- **WooCommerce REST Integration**: Live pricing, stock inventory, product variations, and coupon management with Consumer Key/Secret authentication.
- **Persistent Cart & Wishlist**: Dynamic cart drawer, saved fasteners list, and instant checkout handoff.
- **Storefront & Contact Info**: Unified contact details (+91 81077 53647, 2 Paneri Belda Road, Udaipur) and Google Maps embedding.

## Local Setup

1. Run `npm install`.
2. Ensure environment variables are configured in `.env.local`:
   ```env
   NEXT_PUBLIC_WP_URL=https://slateblue-frog-836232.hostingersite.com
   WOOCOMMERCE_CONSUMER_KEY=your-consumer-key
   WOOCOMMERCE_CONSUMER_SECRET=your-consumer-secret
   NEXT_PUBLIC_WHATSAPP_NUMBER=918107753647
   NEXT_PUBLIC_SUPPORT_PHONE=+918107753647
   NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY=+91 81077 53647
   NEXT_PUBLIC_STORE_ADDRESS="2, Paneri Belda Road, Udaipur, Rajasthan, India"
   NEXT_PUBLIC_WORKING_HOURS="9:00 AM - 5:30 PM"
   ```
3. Run `npm run dev` and open `http://127.0.0.1:3000`.

## Build Verification

```bash
npm run build
```
