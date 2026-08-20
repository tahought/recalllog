"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupRequestSchema } from "@/app/_types";
import type { SignupRequest } from "@/app/_types";
import { signupServerAction, checkEmailAvailability } from "@/app/_actions/signup";
import { PasswordField } from "@/app/_components/PasswordField";
import { StrengthMeter } from "@/app/_components/StrengthMeter";

type EmailStatus = "idle" | "checking" | "available" | "taken";

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState("");
  const [done, setDone] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupRequest>({
    resolver: zodResolver(signupRequestSchema),
    mode: "onChange",
  });

  const password = watch("password") ?? "";
  const email = watch("email") ?? "";

  // ── メールアドレスのリアルタイム重複チェック（デバウンス） ──────────
  useEffect(() => {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailStatus("idle");
      return;
    }
    setEmailStatus("checking");
    const t = setTimeout(async () => {
      const { available } = await checkEmailAvailability(email);
      setEmailStatus(available ? "available" : "taken");
    }, 500);
    return () => clearTimeout(t);
  }, [email]);

  const onSubmit = (data: SignupRequest) => {
    setRootError("");
    startTransition(async () => {
      const res = await signupServerAction(data);
      if (!res.success) {
        setRootError(res.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    });
  };

  if (done) {
    return (
      <div className="container-narrow" style={{ paddingTop: 56 }}>
        <div className="panel center">
          <div className="eyebrow">Success</div>
          <h1>登録が完了しました</h1>
          <p className="muted">ログイン画面へ移動します…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow" style={{ paddingTop: 56 }}>
      <div className="panel">
        <div className="eyebrow">Create account</div>
        <h1>新規登録</h1>
        {rootError && <div className="alert alert-error">{rootError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="name">表示名</label>
            <input id="name" type="text" {...register("name")} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div className="field">
            <label htmlFor="email">メールアドレス</label>
            <input id="email" type="email" autoComplete="username" {...register("email")} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
            {!errors.email && emailStatus === "checking" && (
              <p className="hint">確認中…</p>
            )}
            {!errors.email && emailStatus === "available" && (
              <p className="hint" style={{ color: "var(--ok)" }}>
                ✓ このメールアドレスは使用できます
              </p>
            )}
            {!errors.email && emailStatus === "taken" && (
              <p className="field-error">このメールアドレスは既に使用されています。</p>
            )}
          </div>

          <PasswordField
            id="password"
            label="パスワード"
            {...register("password")}
            error={errors.password?.message}
          />
          <div style={{ marginTop: -8, marginBottom: 16 }}>
            <StrengthMeter password={password} />
            <p className="hint">
              10文字以上・英大文字・英小文字・数字・記号をそれぞれ1つ以上。
            </p>
          </div>

          <PasswordField
            id="confirmPassword"
            label="パスワード（確認用）"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          <button
            className="btn btn-block"
            disabled={isPending || emailStatus === "taken"}
          >
            {isPending ? "登録中…" : "アカウントを作成"}
          </button>
        </form>
        <p className="hint" style={{ marginTop: 16 }}>
          すでにアカウントをお持ちですか？ <Link href="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
