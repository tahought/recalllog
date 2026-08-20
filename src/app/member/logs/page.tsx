"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/app/_hooks/apiFetch";
import type { ApiResponse } from "@/app/_types";
import { REVIEW_INTERVALS_DAYS } from "@/libs/srs";

type StudyLog = {
  id: string;
  title: string;
  content: string;
  tag: string;
  stage: number;
  reviewCount: number;
  isCompleted: boolean;
  learnedAt: string;
  nextReviewAt: string;
};

const todayStr = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });

export default function LogsPage() {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  // form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [learnedAt, setLearnedAt] = useState(todayStr());
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    const url = query
      ? `/api/study-logs?q=${encodeURIComponent(query)}`
      : "/api/study-logs";
    const res = await apiFetch(url);
    if (res.ok) {
      const d = (await res.json()) as ApiResponse<StudyLog[]>;
      setLogs(d.payload);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => void load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTag("");
    setLearnedAt(todayStr());
    setEditingId(null);
    setError("");
  };

  const save = async () => {
    setError("");
    if (!title.trim()) {
      setError("学んだ内容の見出しを入力してください。");
      return;
    }
    const payload = { title, content, tag, learnedAt };
    const url = editingId ? `/api/study-logs/${editingId}` : "/api/study-logs";
    const method = editingId ? "PUT" : "POST";
    const res = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      resetForm();
      await load(q);
    } else {
      const d = (await res.json()) as ApiResponse<unknown>;
      setError(d.message || "保存に失敗しました。");
    }
  };

  const startEdit = (l: StudyLog) => {
    setEditingId(l.id);
    setTitle(l.title);
    setContent(l.content);
    setTag(l.tag);
    setLearnedAt(l.learnedAt.slice(0, 10));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    const res = await apiFetch(`/api/study-logs/${id}`, { method: "DELETE" });
    if (res.ok) await load(q);
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="eyebrow">Study logs</div>
      <h1>学習ログ</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        学んだことを記録すると、忘却曲線（
        {REVIEW_INTERVALS_DAYS.join("・")}日）に沿って復習日が設定されます。
      </p>

      {/* 入力フォーム */}
      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>
          {editingId ? "学習ログを編集" : "新しい学習ログ"}
        </h3>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="t">学んだこと（見出し）</label>
          <input
            id="t"
            type="text"
            value={title}
            maxLength={100}
            placeholder="例：英語の仮定法過去完了"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="c">詳細・メモ（任意）</label>
          <textarea
            id="c"
            value={content}
            maxLength={4000}
            placeholder="要点、例文、つまずいた点など"
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="tag">タグ（任意）</label>
            <input
              id="tag"
              type="text"
              value={tag}
              maxLength={30}
              placeholder="例：英語 / 数学 / 資格"
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="d">学習した日</label>
            <input
              id="d"
              type="date"
              value={learnedAt}
              max={todayStr()}
              onChange={(e) => setLearnedAt(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={save}>
            {editingId ? "更新する" : "記録する"}
          </button>
          {editingId && (
            <button className="btn btn-ghost" onClick={resetForm}>
              キャンセル
            </button>
          )}
        </div>
      </div>

      {/* 検索 */}
      <div className="field" style={{ marginTop: 24 }}>
        <input
          type="text"
          value={q}
          placeholder="🔍 見出し・メモ・タグで検索"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="spinner">読み込み中…</p>
      ) : logs.length === 0 ? (
        <p className="muted">
          {q ? "該当する学習ログがありません。" : "まだ学習ログがありません。"}
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>学んだこと</th>
              <th>タグ</th>
              <th>次回復習</th>
              <th>進捗</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{l.title}</div>
                  {l.content && (
                    <div
                      className="muted"
                      style={{
                        fontSize: "0.82rem",
                        maxWidth: 360,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.content}
                    </div>
                  )}
                </td>
                <td>{l.tag ? <span className="tag">{l.tag}</span> : "—"}</td>
                <td className="mono">
                  {l.isCompleted ? (
                    <span className="badge badge-active">習得済み</span>
                  ) : (
                    <>
                      {fmtDate(l.nextReviewAt)}
                      {new Date(l.nextReviewAt) < new Date() && (
                        <div className="overdue-flag">延滞</div>
                      )}
                    </>
                  )}
                </td>
                <td>
                  <div className="stage-dots">
                    {REVIEW_INTERVALS_DAYS.map((_, i) => (
                      <span key={i} className={`d ${i <= l.stage ? "on" : ""}`} />
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => startEdit(l)}
                    >
                      編集
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => remove(l.id)}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
