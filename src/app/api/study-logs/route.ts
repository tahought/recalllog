import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAuth } from "../_helper/verifyAuth";
import { studyLogSchema } from "@/app/_types";
import type { ApiResponse } from "@/app/_types";
import { initialSchedule } from "@/libs/srs";

/**
 * 学習ログ一覧を返す（認可：本人のログのみ）。
 * クエリパラメータ:
 *   - q   : タイトル/内容/タグの部分一致検索
 *   - due : "today" のとき「今日までに復習すべき」ものだけに絞る
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
  const q = searchParams.get("q")?.trim();
  const due = searchParams.get("due");

  const where: Record<string, unknown> = { userId: user.id };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
      { tag: { contains: q } },
    ];
  }
  if (due === "today") {
    where.isCompleted = false;
    where.nextReviewAt = { lte: new Date() };
  }

  const logs = await prisma.studyLog.findMany({
    where,
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json<ApiResponse<typeof logs>>({
    success: true,
    payload: logs,
    message: "",
  });
}

/** 学習ログを新規作成し、初回復習日（学習日の1日後）を自動設定する。 */
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }

  const parsed = studyLogSchema.safeParse(await req.json());
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

  const { title, content, tag, learnedAt } = parsed.data;
  const learnedDate = learnedAt ? new Date(`${learnedAt}T00:00:00`) : new Date();
  const { stage, nextReviewAt } = initialSchedule(learnedDate);

  const log = await prisma.studyLog.create({
    data: {
      title,
      content: content ?? "",
      tag: tag ?? "",
      userId: user.id,
      learnedAt: learnedDate,
      stage,
      nextReviewAt,
    },
  });

  return NextResponse.json<ApiResponse<typeof log>>({
    success: true,
    payload: log,
    message: "学習ログを記録しました。次回復習日を設定しました。",
  });
}
