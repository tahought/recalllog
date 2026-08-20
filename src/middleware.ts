import { NextRequest, NextResponse } from "next/server";

/**
 * リクエストごとに nonce（ワンタイムの許可証）を発行し、
 * その nonce を持つスクリプトだけを許可する厳格な CSP を付与する。
 *
 * これにより「Next.js が生成する正規のスクリプト」だけが実行でき、
 * 攻撃者が注入したインラインスクリプト（nonce を知り得ない）は
 * ブロックされる。'unsafe-inline' を使わずに XSS 耐性を確保する方式。
 */
export function middleware(request: NextRequest) {
  // リクエストごとにランダムな nonce を生成
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  // 開発時は HMR のため 'unsafe-eval' を許可（本番では付けない）
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'strict-dynamic'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'", // Next.js の生成するインラインスタイルを許可
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  // nonce を後続（Next.js のスクリプトタグ生成）へ渡すためリクエストヘッダに載せる
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // 静的アセットやファビコン等を除く全ルートに適用
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
