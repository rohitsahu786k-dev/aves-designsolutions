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
};

export default nextConfig;
