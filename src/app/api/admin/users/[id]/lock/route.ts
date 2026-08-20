import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifyAdmin } from "../../../../_helper/verifyAuth";
import type { ApiResponse } from "@/app/_types";

/**
 * ユーザアカウントのロック / ロック解除（管理者専用）。
 * body: { isLocked: boolean }
 *
 * ロックされたユーザはログインできず、リフレッシュ時にもトークンが破棄される。
 * 管理者が自分自身をロックすることは防ぐ。
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "管理者権限が必要です。" },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  if (id === admin.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "自分自身はロックできません。" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const isLocked = Boolean(body?.isLocked);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, payload: null, message: "対象ユーザが見つかりません。" },
      { status: 404 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isLocked },
    select: { id: true, email: true, isLocked: true },
  });

  return NextResponse.json<ApiResponse<typeof updated>>({
    success: true,
    payload: updated,
    message: isLocked
      ? "アカウントをロックしました。"
      : "アカウントのロックを解除しました。",
  });
}
