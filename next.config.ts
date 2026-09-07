import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 本番配信サイズを抑えてLighthouseの転送量指標を改善
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['react-icons', 'lucide-react', '@react-three/drei', 'three'],
    optimizeCss: true,
  },
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
              "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
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
      {
        // 各プロジェクトのシステム構成図（Archify製の自己完結HTML）を
        // プロジェクトページ内のiframeで表示するため、この一覧のファイルだけ
        // 同一オリジンからの埋め込みと、図が使うGoogle Fontsの読み込みを許可する
        // （他は全ページDENY / 厳格なCSPのまま）。
        source: '/projects/:file(saa-drill|sonta-kun|cutting-works|burst-style)-architecture.html',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

import withBundleAnalyzer from '@next/bundle-analyzer';

const analyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzerConfig(nextConfig);
