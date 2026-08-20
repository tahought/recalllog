import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAuth } from "../_helper/verifyAuth";
import type { ApiResponse } from "@/app/_types";

/** ログイン中ユーザ自身のログイン履歴（直近20件）を返す。 */
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }
  const history = await prisma.loginHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true },
  });
  return NextResponse.json<ApiResponse<typeof history>>({
    success: true,
    payload: history,
    message: "",
  });
}
