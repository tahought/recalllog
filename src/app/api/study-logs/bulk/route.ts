import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAuth } from "../../_helper/verifyAuth";
import { bulkStudyLogSchema } from "@/app/_types";
import type { ApiResponse } from "@/app/_types";
import { initialSchedule } from "@/libs/srs";

/**
 * 学習ログの一括登録。
 * 各行は「タイトル」または「タイトル, タグ」の形式。
 *  - 行にカンマがあれば、最後のカンマ以降を「その行のタグ」として扱う
 *  - カンマが無い行には共通タグ（commonTag）を適用する
 * すべての行に同じ学習日（learnedAt）と、そこから計算した初回復習日を設定する。
 */
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "未認証です。" },
      { status: 401 },
    );
  }

  const parsed = bulkStudyLogSchema.safeParse(await req.json());
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

  const { lines, commonTag, learnedAt } = parsed.data;
  const learnedDate = learnedAt ? new Date(`${learnedAt}T00:00:00`) : new Date();
  const { stage, nextReviewAt } = initialSchedule(learnedDate);

  // 各行を「タイトル」と「タグ」に分解する
  const rows = lines
    .map((raw) => {
      const line = raw.trim();
      if (!line) return null;
      const commaIdx = line.lastIndexOf(",");
      // 全角カンマにも対応
      const zenIdx = line.lastIndexOf("、");
      const idx = Math.max(commaIdx, zenIdx);
      let title = line;
      let tag = commonTag ?? "";
      if (idx > 0) {
        const maybeTag = line.slice(idx + 1).trim();
        const maybeTitle = line.slice(0, idx).trim();
        if (maybeTitle && maybeTag) {
          title = maybeTitle;
          tag = maybeTag.slice(0, 30);
        }
      }
      return {
        title: title.slice(0, 100),
        content: "",
        tag,
        userId: user.id,
        learnedAt: learnedDate,
        stage,
        nextReviewAt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "有効な行がありませんでした。" },
      { status: 400 },
    );
  }

  await prisma.studyLog.createMany({ data: rows });

  return NextResponse.json<ApiResponse<{ count: number }>>({
    success: true,
    payload: { count: rows.length },
    message: `${rows.length}件をまとめて記録しました。`,
  });
}
