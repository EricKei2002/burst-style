import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://vercel.live https://vercel.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://challenges.cloudflare.com https://vercel.live https://vercel.com; font-src 'self' data:; frame-src 'self' https://challenges.cloudflare.com https://vercel.live https://vercel.com; connect-src 'self' https://challenges.cloudflare.com https://vercel.live https://vercel.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
