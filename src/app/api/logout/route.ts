import { NextResponse } from "next/server";
import type { ApiResponse } from "@/app/_types";
import { clearAuthCookies } from "../_helper/cookies";

/**
 * ログアウト。
 * トークンベース認証（JWT）では、サーバ側に認証状態を持たないため、
 * クライアントの Cookie を無効化（maxAge=0）するだけでよい。
 */
export async function POST() {
  const res = NextResponse.json<ApiResponse<null>>({
    success: true,
    payload: null,
    message: "ログアウトしました。",
  });
  clearAuthCookies(res);
  return res;
}
