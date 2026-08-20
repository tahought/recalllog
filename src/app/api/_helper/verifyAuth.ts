import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { COOKIE } from "@/config/auth";
import { verifyAccessToken } from "./jwt";
import type { JwtPayload } from "@/app/_types";

/**
 * リクエストの Cookie から JWT を取り出して検証する。
 * 認証成功ならペイロード（ユーザ情報）を返す。DB アクセスは発生しない。
 *
 * NextRequest が渡された場合はそこから、なければ next/headers の cookies() から読む。
 */
export const verifyAuth = async (
  req?: NextRequest,
): Promise<JwtPayload | null> => {
  let token: string | undefined;
  if (req) {
    token = req.cookies.get(COOKIE.accessToken)?.value;
  } else {
    const store = await cookies();
    token = store.get(COOKIE.accessToken)?.value;
  }
  if (!token) return null;
  return await verifyAccessToken(token);
};

/** 管理者（ADMIN）であることを要求する。 */
export const verifyAdmin = async (
  req?: NextRequest,
): Promise<JwtPayload | null> => {
  const user = await verifyAuth(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
};
