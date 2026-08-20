import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAdmin } from "../../_helper/verifyAuth";
import type { ApiResponse } from "@/app/_types";

/**
 * 全ユーザ一覧の取得（管理者専用）。
 * verifyAdmin で JWT のペイロード内 role が ADMIN であることを確認する。
 * これが「認可（Authorization）」の中核。
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "管理者権限が必要です。" },
      { status: 403 },
    );
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isLocked: true,
      createdAt: true,
      _count: { select: { studyLogs: true } },
    },
  });
  return NextResponse.json<ApiResponse<typeof users>>({
    success: true,
    payload: users,
    message: "",
  });
}
