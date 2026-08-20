import type { NextConfig } from "next";

/**
 * Content Security Policy (CSP)
 * ------------------------------------------------------------------
 * XSS 攻撃や意図しない外部リソースの読み込みを防ぐための「最後の砦」。
 * 本アプリはインラインスクリプトを極力使わない構成にしているが、
 * Next.js の開発モードでは eval / inline が必要になるため、
 * production と development でポリシーを切り替える。
 */
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  // 本番ではインラインスクリプトを禁止。開発時のみ Next.js の HMR 用に緩和
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self'",
  // style は Next.js が生成するインラインスタイルを許可
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'", // クリックジャッキング対策
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
