import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/libs/prisma";
import { changePasswordSchema } from "@/app/_types";
import type { ApiResponse } from "@/app/_types";
import { verifyAuth } from "../_helper/verifyAuth";
import { clearAuthCookies } from "../_helper/cookies";

const COST_FACTOR = 10;

/**
 * パスワード変更。
 *  - 認証必須（Cookie 内 JWT を検証）
 *  - 現在のパスワードを bcrypt.compare で確認してから変更
 *  - 新パスワードは zod で強度を再検証
 *  - 変更後はトークンを無効化し、再ログインを促す
 */
export async function PUT(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }

  const parsed = changePasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        payload: null,
        message: parsed.error.issues[0]?.message ?? "入力内容が正しくありません。",
      },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "ユーザが見つかりません。" },
      { status: 404 },
    );
  }

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "現在のパスワードが正しくありません。" },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(newPassword, COST_FACTOR);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  // セキュリティのため、変更後はセッション（トークン）を破棄して再ログインさせる
  const res = NextResponse.json<ApiResponse<null>>({
    success: true,
    payload: null,
    message: "パスワードを変更しました。再度ログインしてください。",
  });
  clearAuthCookies(res);
  return res;
}
