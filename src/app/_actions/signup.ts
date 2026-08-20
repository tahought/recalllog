"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/libs/prisma";
import { signupRequestSchema } from "@/app/_types";
import type { SignupRequest, ServerActionResponse, PublicUser } from "@/app/_types";

const COST_FACTOR = 10;

/**
 * サインアップのサーバアクション（Next.js Server Actions / Custom Invocation）。
 * API ルートを設けず、クライアントから直接呼び出す形で実装している。
 *
 * セキュリティ上のポイント：
 *  - パスワードは bcrypt でハッシュ化してから保存（平文保存は厳禁）
 *  - 入力値は zod で厳格に再検証（クライアント側の検証は信用しない）
 *  - パスワードなど機密情報はレスポンスに含めない
 *  - 内部エラーの詳細はクライアントに返さない
 */
export const signupServerAction = async (
  req: SignupRequest,
): Promise<ServerActionResponse<PublicUser | null>> => {
  try {
    // サーバ側での再検証（クライアントのバリデーションは信用しない）
    const parsed = signupRequestSchema.safeParse(req);
    if (!parsed.success) {
      return {
        success: false,
        payload: null,
        message: parsed.error.issues[0]?.message ?? "入力内容が正しくありません。",
      };
    }
    const { name, email, password } = parsed.data;

    // スパム登録対策の軽い遅延
    await new Promise((r) => setTimeout(r, 500));

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // 本来はユーザ列挙を避けるため確認メール方式が望ましいが、
      // 個人利用のため利便性を優先し、重複を明示する。
      return {
        success: false,
        payload: null,
        message: "このメールアドレスは既に使用されています。",
      };
    }

    const hashed = await bcrypt.hash(password, COST_FACTOR);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "USER" },
    });

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return { success: true, payload: publicUser, message: "登録が完了しました。" };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      payload: null,
      message: "サーバ側の処理に失敗しました。",
    };
  }
};

/**
 * メールアドレスの重複をリアルタイムに確認するサーバアクション。
 * サインアップ画面で入力中に「使用可能かどうか」を表示するために使う。
 */
export const checkEmailAvailability = async (
  email: string,
): Promise<{ available: boolean }> => {
  try {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { available: false };
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    return { available: !existing };
  } catch {
    return { available: false };
  }
};
