import type { NextConfig } from "next";

/**
 * セキュリティヘッダ。
 * ------------------------------------------------------------------
 * Content-Security-Policy（CSP）はリクエストごとの nonce が必要なため、
 * middleware.ts で動的に付与している（ここには置かない）。
 * ここでは nonce に依存しない静的なセキュリティヘッダのみを設定する。
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
