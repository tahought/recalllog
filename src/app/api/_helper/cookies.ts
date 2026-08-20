import { NextResponse } from "next/server";
import { AUTH, COOKIE } from "@/config/auth";

const isProd = process.env.NODE_ENV === "production";

/**
 * 認証用 Cookie を安全な属性でセットする。
 *  - httpOnly : JavaScript から読めない → XSS で JWT が盗まれない
 *  - secure   : HTTPS 通信でのみ送信（本番）
 *  - sameSite=strict : CSRF 対策
 *  - path=/   : サイト全体で有効
 */
export const setAuthCookies = (
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookies.set(COOKIE.accessToken, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: AUTH.accessTokenMaxAgeSec,
  });
  res.cookies.set(COOKIE.refreshToken, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: AUTH.refreshTokenMaxAgeSec,
  });
};

/** ログアウト時に Cookie を無効化する（maxAge=0）。 */
export const clearAuthCookies = (res: NextResponse) => {
  for (const name of [COOKIE.accessToken, COOKIE.refreshToken]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }
};
