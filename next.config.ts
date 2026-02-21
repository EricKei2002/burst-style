import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Best Practices改善: ソースマップを本番環境でも提供
  productionBrowserSourceMaps: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // worker-src, child-src, object-src を追加してコンソールエラーを解消
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://challenges.cloudflare.com https://vercel.live https://vercel.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://challenges.cloudflare.com https://vercel.live https://vercel.com",
              "font-src 'self' data:",
              "frame-src 'self' blob: https://challenges.cloudflare.com https://vercel.live https://vercel.com",
              "connect-src 'self' https://challenges.cloudflare.com https://vercel.live https://vercel.com https://cloudflareinsights.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob: https://challenges.cloudflare.com",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
