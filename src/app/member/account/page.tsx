"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/app/_types";
import type { ChangePasswordRequest, ApiResponse } from "@/app/_types";
import { useAuth } from "@/app/_contexts/AuthContext";
import { apiFetch } from "@/app/_hooks/apiFetch";
import { PasswordField } from "@/app/_components/PasswordField";
import { StrengthMeter } from "@/app/_components/StrengthMeter";

type History = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<History[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });
  const newPw = watch("newPassword") ?? "";

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/api/login-history");
      if (res.ok) {
        const data = (await res.json()) as ApiResponse<History[]>;
        setHistory(data.payload);
      }
    })();
  }, []);

  const onSubmit = async (data: ChangePasswordRequest) => {
    setMsg(null);
    const res = await apiFetch("/api/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = (await res.json()) as ApiResponse<null>;
    if (res.ok && body.success) {
      reset();
      setMsg({ type: "ok", text: body.message });
      // パスワード変更でトークンが破棄されるため、再ログインへ
      await refreshUser();
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setMsg({ type: "error", text: body.message });
    }
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="eyebrow">Account</div>
      <h1>アカウント</h1>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>プロフィール</h3>
        <table className="table">
          <tbody>
            <tr>
              <th>表示名</th>
              <td>{user?.name}</td>
            </tr>
            <tr>
              <th>メール</th>
              <td className="mono">{user?.email}</td>
            </tr>
            <tr>
              <th>ロール</th>
              <td>
                <span
                  className={`badge ${
                    user?.role === "ADMIN" ? "badge-admin" : "badge-user"
                  }`}
                >
                  {user?.role}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>パスワード変更</h3>
        {msg && (
          <div className={`alert ${msg.type === "ok" ? "alert-ok" : "alert-error"}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <PasswordField
            id="cur"
            label="現在のパスワード"
            {...register("currentPassword")}
            error={errors.currentPassword?.message}
          />
          <PasswordField
            id="new"
            label="新しいパスワード"
            {...register("newPassword")}
            error={errors.newPassword?.message}
          />
          <div style={{ marginTop: -8, marginBottom: 16 }}>
            <StrengthMeter password={newPw} />
          </div>
          <PasswordField
            id="conf"
            label="新しいパスワード（確認用）"
            {...register("confirmNewPassword")}
            error={errors.confirmNewPassword?.message}
          />
          <button className="btn" disabled={isSubmitting}>
            {isSubmitting ? "変更中…" : "パスワードを変更"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>ログイン履歴</h3>
        {history.length === 0 ? (
          <p className="muted">履歴はまだありません。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>日時</th>
                <th>IP</th>
                <th>User-Agent</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="mono">
                    {new Date(h.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="mono">{h.ipAddress ?? "—"}</td>
                  <td
                    className="mono"
                    style={{
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={h.userAgent ?? ""}
                  >
                    {h.userAgent ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
