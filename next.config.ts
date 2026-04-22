import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; connect-src 'self' https://generativelanguage.googleapis.com https://maps.googleapis.com https://www.googleapis.com; img-src 'self' data: https:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
