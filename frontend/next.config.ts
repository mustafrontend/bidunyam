import type { NextConfig } from "next";
import path from "path";

const gatewayUrl =
  process.env.GATEWAY_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "http://gateway:8080");

const nextConfig: NextConfig = {
  output: "standalone",
  // Kök dizini bu klasöre sabitle — aksi halde Next, C:\pnpm-lock.yaml'ı
  // görüp workspace kökünü yanlış seçiyor ve başka projeden modül çekiyor.
  turbopack: {
    root: path.resolve(__dirname),
  },
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
