import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { COOKIE } from "@/config/auth";
import type { ApiResponse, PublicUser, JwtPayload } from "@/app/_types";
import { verifyRefreshToken, createAccessToken, createRefreshToken } from "../_helper/jwt";
import { setAuthCookies, clearAuthCookies } from "../_helper/cookies";

/**
 * サイレントリフレッシュ。
 * アクセストークン（短命）の有効期限が切れても、リフレッシュトークンが
 * 有効なら、ユーザに再ログインを求めることなく新しいアクセストークンを発行する。
 */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(COOKIE.refreshToken)?.value;
  if (!refreshToken) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "リフレッシュトークンがありません。" },
      { status: 401 },
    );
  }

  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) {
    const res = NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "リフレッシュトークンが無効です。" },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  // 最新のユーザ情報を DB から取得（ロック状態や role 変更を反映するため）
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isLocked) {
    const res = NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "アカウントが利用できません。" },
      { status: 403 },
    );
    clearAuthCookies(res);
    return res;
  }

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const newAccess = await createAccessToken(payload);
  const newRefresh = await createRefreshToken(user.id);

  const publicUser: PublicUser = payload;
  const res = NextResponse.json<ApiResponse<PublicUser>>({
    success: true,
    payload: publicUser,
    message: "トークンを更新しました。",
  });
  setAuthCookies(res, newAccess, newRefresh);
  return res;
}
