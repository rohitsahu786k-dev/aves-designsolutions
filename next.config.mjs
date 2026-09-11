const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "search" }],
        destination: "/shop",
        permanent: false,
      },
      {
        source: "/my-account",
        destination: "/account",
        permanent: true,
      },
      {
        source: "/my-account/:path*",
        destination: "/account",
        permanent: true,
      },
      {
        source: "/manage-wp",
        destination: "https://wp.screwnet.in/wp-login.php",
        permanent: false,
      },
      {
        source: "/manage-wp/:path*",
        destination: "https://wp.screwnet.in/wp-login.php",
        permanent: false,
      },
      {
        source: "/wp-admin",
        destination: "https://wp.screwnet.in/wp-admin",
        permanent: false,
      },
      {
        source: "/wp-admin/:path*",
        destination: "https://wp.screwnet.in/wp-admin/:path*",
        permanent: false,
      },
      {
        source: "/wp-login.php",
        destination: "https://wp.screwnet.in/wp-login.php",
        permanent: false,
      },
      {
        source: "/download-catalogue",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/download-catalogue/:path*",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/catalogue",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/catalogue/:path*",
        destination: "/shop",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wp.screwnet.in",
      },
      {
        protocol: "https",
        hostname: "slateblue-frog-836232.hostingersite.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      {
        source: "/icon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/apple-icon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
