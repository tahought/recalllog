"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/app/_hooks/apiFetch";
import { useAuth } from "@/app/_contexts/AuthContext";
import type { ApiResponse } from "@/app/_types";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  isLocked: boolean;
  createdAt: string;
  _count: { studyLogs: number };
};

export default function AdminPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/admin/users");
    if (res.ok) {
      const data = (await res.json()) as ApiResponse<AdminUser[]>;
      setUsers(data.payload);
    } else {
      setError("ユーザ一覧の取得に失敗しました。");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLock = async (u: AdminUser) => {
    setError("");
    const res = await apiFetch(`/api/admin/users/${u.id}/lock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !u.isLocked }),
    });
    if (res.ok) {
      await load();
    } else {
      const data = (await res.json()) as ApiResponse<unknown>;
      setError(data.message || "操作に失敗しました。");
    }
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="eyebrow">Administrator</div>
      <h1>ユーザ管理</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        この画面は ADMIN ロールのユーザだけがアクセスできます（認可の実演）。
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel" style={{ marginTop: 20 }}>
        {loading ? (
          <p className="spinner">読み込み中…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>表示名</th>
                <th>メール</th>
                <th>ロール</th>
                <th>ログ数</th>
                <th>状態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === "ADMIN" ? "badge-admin" : "badge-user"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="mono">{u._count.studyLogs}</td>
                  <td>
                    {u.isLocked ? (
                      <span className="badge badge-locked">LOCKED</span>
                    ) : (
                      <span className="badge badge-active">ACTIVE</span>
                    )}
                  </td>
                  <td>
                    {u.id === me?.id ? (
                      <span className="muted" style={{ fontSize: "0.8rem" }}>
                        自分
                      </span>
                    ) : (
                      <button
                        className={`btn btn-sm ${
                          u.isLocked ? "btn-ghost" : "btn-danger"
                        }`}
                        onClick={() => toggleLock(u)}
                      >
                        {u.isLocked ? "ロック解除" : "ロック"}
                      </button>
                    )}
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
