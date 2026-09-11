const nextConfig = {
  async redirects() {
    return [{
      source: "/",
      has: [{ type: "query", key: "search" }],
      destination: "/shop",
      permanent: false,
    }];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
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
