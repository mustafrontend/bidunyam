import type { NextConfig } from "next";

const gatewayUrl =
  process.env.GATEWAY_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "http://gateway:8080");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${gatewayUrl}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
