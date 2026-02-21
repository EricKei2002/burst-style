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
              "media-src 'self' data: blob:",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // Best Practices改善: 強力なHSTSポリシー
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // セキュリティヘッダー追加
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
