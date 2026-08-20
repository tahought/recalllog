import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAuth } from "../_helper/verifyAuth";
import type { ApiResponse } from "@/app/_types";
import { endOfToday, addDays } from "@/libs/srs";

export type DashboardStats = {
  dueToday: number; // 今日までに復習すべき件数
  dueTomorrow: number; // 明日が期限の件数
  totalActive: number; // 学習中（未習得）の件数
  totalCompleted: number; // 習得済みの件数
  reviewsLast7Days: number; // 直近7日間の復習回数
  recallRate: number; // 直近の正答率（%）
};

/** ダッシュボード用の集計値を返す（本人のデータのみ）。 */
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }

  const now = new Date();
  const endToday = endOfToday(now);
  const startTomorrow = addDays(endToday, 0); // 今日の終わり以降
  const endTomorrow = endOfToday(addDays(now, 1));
  const sevenDaysAgo = addDays(now, -7);

  const [
    dueToday,
    dueTomorrow,
    totalActive,
    totalCompleted,
    reviewsLast7Days,
    recentReviews,
  ] = await Promise.all([
    prisma.studyLog.count({
      where: { userId: user.id, isCompleted: false, nextReviewAt: { lte: endToday } },
    }),
    prisma.studyLog.count({
      where: {
        userId: user.id,
        isCompleted: false,
        nextReviewAt: { gt: startTomorrow, lte: endTomorrow },
      },
    }),
    prisma.studyLog.count({
      where: { userId: user.id, isCompleted: false },
    }),
    prisma.studyLog.count({
      where: { userId: user.id, isCompleted: true },
    }),
    prisma.review.count({
      where: {
        studyLog: { userId: user.id },
        reviewedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.review.findMany({
      where: { studyLog: { userId: user.id }, reviewedAt: { gte: sevenDaysAgo } },
      select: { recalled: true },
    }),
  ]);

  const recallRate =
    recentReviews.length === 0
      ? 0
      : Math.round(
          ((recentReviews as { recalled: boolean }[]).filter((r) => r.recalled)
            .length /
            recentReviews.length) *
            100,
        );

  const stats: DashboardStats = {
    dueToday,
    dueTomorrow,
    totalActive,
    totalCompleted,
    reviewsLast7Days,
    recallRate,
  };

  return NextResponse.json<ApiResponse<DashboardStats>>({
    success: true,
    payload: stats,
    message: "",
  });
}
