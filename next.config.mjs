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
