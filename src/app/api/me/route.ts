import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../_helper/verifyAuth";
import type { ApiResponse, PublicUser } from "@/app/_types";

/** 現在ログイン中のユーザ情報を返す。認証は Cookie 内 JWT の署名検証のみ（DB 不要）。 */
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }
  const publicUser: PublicUser = user;
  return NextResponse.json<ApiResponse<PublicUser>>({
    success: true,
    payload: publicUser,
    message: "",
  });
}
