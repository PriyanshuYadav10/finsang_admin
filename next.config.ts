import type { NextConfig } from "next";

const backendUrlRaw =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001/api";
const backendUrl = backendUrlRaw.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    const destination = backendUrl.endsWith('/api')
      ? `${backendUrl}/:path*`
      : `${backendUrl}/api/:path*`;

    return [
      {
        source: '/api/:path*',
        destination,
      },
    ];
  },
};

export default nextConfig;
