"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/app/_hooks/apiFetch";
import { useAuth } from "@/app/_contexts/AuthContext";
import type { ApiResponse } from "@/app/_types";
import { REVIEW_INTERVALS_DAYS } from "@/libs/srs";

type StudyLog = {
  id: string;
  title: string;
  content: string;
  tag: string;
  stage: number;
  nextReviewAt: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const WD = ["日", "月", "火", "水", "木", "金", "土"];

// 「タイトル」または「タイトル, タグ」をパースする（プレビュー用）
const parseLine = (line: string, common: string) => {
  const idx = Math.max(line.lastIndexOf(","), line.lastIndexOf("、"));
  if (idx > 0) {
    const title = line.slice(0, idx).trim();
    const tag = line.slice(idx + 1).trim();
    if (title && tag) return { title, tag };
  }
  return { title: line, tag: common };
};

export default function HomePage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<StudyLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  // 記録フォーム
  const [bulk, setBulk] = useState("");
  const [commonTag, setCommonTag] = useState("");
  const [datePreset, setDatePreset] = useState("today");
  const [customDate, setCustomDate] = useState(todayStr());

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/study-logs?due=today");
    if (res.ok) {
      const d = (await res.json()) as ApiResponse<StudyLog[]>;
      setQueue(d.payload);
      setTotal((t) => (t === 0 ? d.payload.length : t));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, recalled: boolean) => {
    setBusyId(id);
    setFlash("");
    const res = await apiFetch(`/api/study-logs/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recalled }),
    });
    if (res.ok) {
      const d = (await res.json()) as ApiResponse<unknown>;
      setFlash(d.message);
      setQueue((q) => q.filter((x) => x.id !== id));
    }
    setBusyId(null);
  };

  const resolveLearnedAt = () => {
    const d = new Date();
    if (datePreset === "yesterday") d.setDate(d.getDate() - 1);
    else if (datePreset === "2days") d.setDate(d.getDate() - 2);
    else if (datePreset === "custom") return customDate;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const lines = bulk
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const submitBulk = async () => {
    setError("");
    setFlash("");
    if (lines.length === 0) {
      setError("勉強したことを1行以上入力してください。");
      return;
    }
    const res = await apiFetch("/api/study-logs/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, commonTag, learnedAt: resolveLearnedAt() }),
    });
    const body = (await res.json()) as ApiResponse<{ count: number } | null>;
    if (res.ok && body.success) {
      setBulk("");
      setFlash(body.message);
    } else {
      setError(body.message || "登録に失敗しました。");
    }
  };

  const now = new Date();
  const done = total - queue.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="eyebrow">ホーム</div>
      <h1>今日</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        {user?.name} さん、今日の復習を片付けて、やったことを記録しましょう。
      </p>

      {/* 日付・進捗ヒーロー */}
      <div className="home-hero">
        <div className="date">
          <span className="big">
            {now.getMonth() + 1}月{now.getDate()}日
          </span>
          （{WD[now.getDay()]}）
          <div style={{ marginTop: 6 }}>
            今日の進捗 {done} / {total}
          </div>
          <div className="prog">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="remain">
          <div className="n">{queue.length}</div>
          <div className="l">残りの復習</div>
        </div>
      </div>

      {flash && <div className="alert alert-ok">{flash}</div>}

      {/* 今日の復習 */}
      <h2 className="home-sec">今日の復習</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {loading ? (
          <p className="spinner">読み込み中…</p>
        ) : queue.length === 0 ? (
          <div className="panel center" style={{ padding: 30 }}>
            <h3 style={{ marginTop: 0 }}>今日の復習は完了です 🎉</h3>
            <p className="muted" style={{ margin: 0 }}>
              おつかれさまでした。下から今日やったことを記録しておきましょう。
            </p>
          </div>
        ) : (
          queue.map((log) => (
            <div key={log.id} className="review-item">
              <div className="top">
                <div>
                  <h3>{log.title}</h3>
                  {log.tag && <span className="tag">{log.tag}</span>}
                </div>
                <div className="stage-dots" title={`段階 ${log.stage + 1}`}>
                  {REVIEW_INTERVALS_DAYS.map((_, i) => (
                    <span key={i} className={`d ${i <= log.stage ? "on" : ""}`} />
                  ))}
                </div>
              </div>
              {log.content && <p className="content">{log.content}</p>}
              <div className="review-actions">
                <button
                  className="btn btn-recall btn-sm"
                  disabled={busyId === log.id}
                  onClick={() => review(log.id, true)}
                >
                  覚えていた
                </button>
                <button
                  className="btn btn-forgot btn-sm"
                  disabled={busyId === log.id}
                  onClick={() => review(log.id, false)}
                >
                  忘れていた
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 勉強の記録 */}
      <h2 className="home-sec">勉強の記録</h2>
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>今日やったことを記録</h3>
        <p className="muted" style={{ marginTop: -4, marginBottom: 14 }}>
          1行に1つずつ書いて、まとめて記録できます。復習日は忘却曲線（
          {REVIEW_INTERVALS_DAYS.join("・")}日）で自動設定されます。
        </p>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="bulk">勉強したこと（1行に1つ）</label>
          <textarea
            id="bulk"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"英語の仮定法過去完了, 英語\nReactのuseEffect, プログラミング\n部分積分の公式"}
            style={{ minHeight: 104, lineHeight: 1.8 }}
          />
        </div>

        <div className="tag-howto">
          タグの付け方：<code>勉強したこと, タグ</code>{" "}
          のようにカンマで区切ると、その行のタグになります。例：
          <code>英語の仮定法, 英語</code>{" "}
          → タグ「英語」。カンマが無い行には共通タグが付きます。
        </div>

        {lines.length > 0 && (
          <div className="rec-preview">
            <div className="field-label">プレビュー</div>
            {lines.map((l, i) => {
              const p = parseLine(l, commonTag.trim());
              return (
                <div key={i} className="prev-row">
                  ・{p.title}
                  <span className="muted"> の勉強をした</span>{" "}
                  {p.tag ? (
                    <span className="tag" style={{ marginLeft: 4 }}>
                      {p.tag}
                    </span>
                  ) : (
                    <span className="muted" style={{ fontSize: "0.78rem" }}>
                      （タグなし）
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="ctag">共通タグ（任意・カンマ指定が無い行に付きます）</label>
            <input
              id="ctag"
              type="text"
              value={commonTag}
              maxLength={30}
              placeholder="例：英語"
              onChange={(e) => setCommonTag(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="dp">日付</label>
            <select
              id="dp"
              className="select"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
            >
              <option value="today">今日</option>
              <option value="yesterday">昨日</option>
              <option value="2days">2日前</option>
              <option value="custom">日付を指定</option>
            </select>
          </div>
          {datePreset === "custom" && (
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="cd">指定する日付</label>
              <input
                id="cd"
                type="date"
                value={customDate}
                max={todayStr()}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn" onClick={submitBulk}>
            まとめて記録する
          </button>
          {lines.length > 0 && (
            <span className="muted" style={{ fontSize: "0.88rem" }}>
              {lines.length}件を記録します
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
