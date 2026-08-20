import { z } from "zod";

/**
 * パスワードのバリデーション。
 * セキュリティの根幹はパスワードの「長さ」と「複雑さ」であるため、
 * zod + 正規表現で厳格に制御する。
 *  - 10文字以上
 *  - 英大文字・英小文字・数字・記号をそれぞれ1文字以上
 *  - 半角のみ（日本語などのマルチバイト文字を弾く）
 */
export const passwordSchema = z
  .string()
  .min(10, { message: "パスワードは10文字以上にしてください。" })
  .max(72, { message: "パスワードは72文字以内にしてください。" }) // bcrypt の入力上限
  .regex(/^[\x21-\x7e]+$/, {
    message: "パスワードに使えるのは半角の英数字と記号のみです。",
  })
  .regex(/[a-z]/, { message: "英小文字を1文字以上含めてください。" })
  .regex(/[A-Z]/, { message: "英大文字を1文字以上含めてください。" })
  .regex(/[0-9]/, { message: "数字を1文字以上含めてください。" })
  .regex(/[^a-zA-Z0-9]/, { message: "記号を1文字以上含めてください。" });

export const emailSchema = z
  .string()
  .email({ message: "メールアドレスの形式が正しくありません。" })
  .max(254);

// サインアップ（確認用パスワードの一致チェックを含む）
export const signupRequestSchema = z
  .object({
    name: z.string().min(1, "表示名を入力してください。").max(30),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "確認用パスワードが一致しません。",
    path: ["confirmPassword"],
  });

export type SignupRequest = z.infer<typeof signupRequestSchema>;

// ログイン
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください。"),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

// パスワード変更
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください。"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "確認用パスワードが一致しません。",
    path: ["confirmNewPassword"],
  });
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

// 学習ログ
export const studyLogSchema = z.object({
  title: z.string().min(1, "学んだ内容の見出しを入力してください。").max(100),
  content: z.string().max(4000).optional().default(""),
  tag: z.string().max(30).optional().default(""),
  // 学習日（省略時はサーバ側で当日）。YYYY-MM-DD 形式を許容。
  learnedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません。")
    .optional(),
});
export type StudyLogInput = z.infer<typeof studyLogSchema>;

// 復習結果の記録
export const reviewSchema = z.object({
  recalled: z.boolean(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

// JWT のペイロード（クライアントにも見える情報のみ。機密情報は入れない）
export type JwtPayload = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

// クライアントに返すユーザ情報（password は絶対に含めない）
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

// API 共通レスポンス
export type ApiResponse<T> = {
  success: boolean;
  payload: T;
  message: string;
};

// Server Action 共通レスポンス
export type ServerActionResponse<T> = {
  success: boolean;
  payload: T;
  message: string;
};
