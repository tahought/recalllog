import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/libs/prisma";
import { loginRequestSchema } from "@/app/_types";
import type { ApiResponse, PublicUser, JwtPayload } from "@/app/_types";
import { RATE_LIMIT } from "@/config/auth";
import { createAccessToken, createRefreshToken } from "../_helper/jwt";
import { setAuthCookies } from "../_helper/cookies";

const fail = (message: string, status = 401) =>
  NextResponse.json<ApiResponse<null>>(
    { success: false, payload: null, message },
    { status },
  );

const getClientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  req.headers.get("x-real-ip") ??
  null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("入力内容が正しくありません。", 400);
    }
    const { email, password } = parsed.data;
    const ip = getClientIp(req);

    // ── レートリミット判定 ────────────────────────────────
    // 直近 windowMin 分の「失敗」回数が上限に達していたら拒否する。
    const since = new Date(Date.now() - RATE_LIMIT.windowMin * 60 * 1000);
    const recentFailures = await prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    });
    if (recentFailures >= RATE_LIMIT.maxFailures) {
      return fail(
        `ログイン試行が多すぎます。${RATE_LIMIT.windowMin}分ほど待ってから再度お試しください。`,
        429,
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // ── 認証処理 ─────────────────────────────────────────
    // ユーザ有無に関わらず bcrypt.compare を実行し、応答時間差による
    // ユーザ列挙（アカウントの存在推測）を避ける。
    const dummyHash =
      "$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvXGFprTiJXO3jY5sEK4z3sQ0G3bK";
    const hashToCompare = user?.password ?? dummyHash;
    const isValid = await bcrypt.compare(password, hashToCompare);

    // 試行を記録（成功/失敗どちらも）
    await prisma.loginAttempt.create({
      data: {
        email,
        success: Boolean(user) && isValid,
        ipAddress: ip,
        userId: user?.id ?? null,
      },
    });

    if (!user || !isValid) {
      return fail("メールアドレスまたはパスワードが正しくありません。");
    }
    if (user.isLocked) {
      return fail(
        "このアカウントは管理者によってロックされています。",
        403,
      );
    }

    // ── ログイン履歴を記録 ───────────────────────────────
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") ?? null,
      },
    });

    // ── JWT 発行 & Cookie セット ─────────────────────────
    const jwtPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const accessToken = await createAccessToken(jwtPayload);
    const refreshToken = await createRefreshToken(user.id);

    const publicUser: PublicUser = jwtPayload;
    const res = NextResponse.json<ApiResponse<PublicUser>>({
      success: true,
      payload: publicUser,
      message: "ログインしました。",
    });
    setAuthCookies(res, accessToken, refreshToken);
    return res;
  } catch (e) {
    console.error(e);
    // 内部エラーの詳細はクライアントに見せない
    return fail("サーバ側の処理に失敗しました。", 500);
  }
}
