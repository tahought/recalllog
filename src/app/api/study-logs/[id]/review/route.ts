import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAuth } from "../../../_helper/verifyAuth";
import { reviewSchema } from "@/app/_types";
import type { ApiResponse } from "@/app/_types";
import { nextSchedule } from "@/libs/srs";

/**
 * 復習結果を記録し、次回復習日を再計算する（間隔反復の中核）。
 * body: { recalled: boolean }  true=覚えていた / false=忘れていた
 *
 * 認可：対象ログが本人のものであることを確認してから更新する。
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  const log = await prisma.studyLog.findUnique({ where: { id } });
  if (!log) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "学習ログが見つかりません。" },
      { status: 404 },
    );
  }
  if (log.userId !== user.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "操作する権限がありません。" },
      { status: 403 },
    );
  }

  const parsed = reviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "入力内容が正しくありません。" },
      { status: 400 },
    );
  }
  const { recalled } = parsed.data;

  const next = nextSchedule(log.stage, recalled);

  // 復習履歴の記録と学習ログの更新をトランザクションで実行
  const [, updated] = await prisma.$transaction([
    prisma.review.create({
      data: { studyLogId: log.id, recalled, stageAt: log.stage },
    }),
    prisma.studyLog.update({
      where: { id: log.id },
      data: {
        stage: next.stage,
        nextReviewAt: next.nextReviewAt,
        isCompleted: next.isCompleted,
        reviewCount: { increment: 1 },
      },
    }),
  ]);

  return NextResponse.json<ApiResponse<typeof updated>>({
    success: true,
    payload: updated,
    message: recalled
      ? next.isCompleted
        ? "お見事！この項目は習得済みになりました。"
        : "次回の復習日を先に延ばしました。"
      : "もう一度、明日復習しましょう。",
  });
}
