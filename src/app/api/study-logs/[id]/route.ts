import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAuth } from "../../_helper/verifyAuth";
import { studyLogSchema } from "@/app/_types";
import type { ApiResponse } from "@/app/_types";

const unauthorized = () =>
  NextResponse.json<ApiResponse<null>>(
    { success: false, payload: null, message: "未認証です。" },
    { status: 401 },
  );

const forbidden = () =>
  NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      payload: null,
      message: "この学習ログを操作する権限がありません。",
    },
    { status: 403 },
  );

/**
 * 学習ログの編集（タイトル・内容・タグ）。
 * 認可のポイント：対象ログの userId がログイン中ユーザと一致することを必ず確認する
 * （IDOR 対策）。SRS の状態（stage/nextReviewAt）はここでは変更しない。
 */
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const log = await prisma.studyLog.findUnique({ where: { id } });
  if (!log) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "学習ログが見つかりません。" },
      { status: 404 },
    );
  }
  if (log.userId !== user.id) return forbidden();

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

  const updated = await prisma.studyLog.update({
    where: { id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content ?? "",
      tag: parsed.data.tag ?? "",
    },
  });
  return NextResponse.json<ApiResponse<typeof updated>>({
    success: true,
    payload: updated,
    message: "学習ログを更新しました。",
  });
}

/** 学習ログの削除（所有者のみ）。関連する復習履歴もカスケード削除される。 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const log = await prisma.studyLog.findUnique({ where: { id } });
  if (!log) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "学習ログが見つかりません。" },
      { status: 404 },
    );
  }
  if (log.userId !== user.id) return forbidden();

  await prisma.studyLog.delete({ where: { id } });
  return NextResponse.json<ApiResponse<null>>({
    success: true,
    payload: null,
    message: "学習ログを削除しました。",
  });
}
