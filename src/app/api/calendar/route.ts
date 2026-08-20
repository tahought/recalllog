import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAuth } from "../_helper/verifyAuth";
import type { ApiResponse } from "@/app/_types";

export type CalendarItem = {
  id: string;
  title: string;
  tag: string;
  nextReviewAt: string;
  isOverdue: boolean;
};

/**
 * 指定した年月の「復習予定」をカレンダー表示用に返す。
 * クエリ: year, month（1-12）。未指定なら当月。
 * 過去に期限が来て未消化のものは、その日付のセルに「延滞」として含める。
 */
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999); // 月末

  const logs = await prisma.studyLog.findMany({
    where: {
      userId: user.id,
      isCompleted: false,
      nextReviewAt: { gte: start, lte: end },
    },
    orderBy: { nextReviewAt: "asc" },
    select: { id: true, title: true, tag: true, nextReviewAt: true },
  });

  type Row = { id: string; title: string; tag: string; nextReviewAt: Date };
  const items: CalendarItem[] = (logs as Row[]).map((l) => ({
    id: l.id,
    title: l.title,
    tag: l.tag,
    nextReviewAt: l.nextReviewAt.toISOString(),
    isOverdue: l.nextReviewAt < now,
  }));

  return NextResponse.json<ApiResponse<CalendarItem[]>>({
    success: true,
    payload: items,
    message: "",
  });
}
