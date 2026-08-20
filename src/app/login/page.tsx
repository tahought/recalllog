"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/_contexts/AuthContext";
import { PasswordField } from "@/app/_components/PasswordField";
import type { LoginRequest, ApiResponse } from "@/app/_types";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [rootError, setRootError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setRootError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !body.success) {
        setRootError(body.message || "ログインに失敗しました。");
        return;
      }
      await refreshUser();
      router.push("/member/dashboard");
    } catch {
      setRootError("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-narrow" style={{ paddingTop: 56 }}>
      <div className="panel">
        <div className="eyebrow">Sign in</div>
        <h1>ログイン</h1>
        {rootError && <div className="alert alert-error">{rootError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              {...register("email", { required: "メールアドレスを入力してください。" })}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <PasswordField
            id="password"
            label="パスワード"
            {...register("password", { required: "パスワードを入力してください。" })}
            error={errors.password?.message}
          />
          <button className="btn btn-block" disabled={submitting}>
            {submitting ? "認証中…" : "ログイン"}
          </button>
        </form>
        <p className="hint" style={{ marginTop: 16 }}>
          アカウントをお持ちでないですか？ <Link href="/signup">新規登録</Link>
        </p>
      </div>
      <p className="hint center" style={{ marginTop: 12 }}>
        連続してログインに失敗すると、一定時間ロックされます（レートリミット）。
      </p>
    </div>
  );
}
