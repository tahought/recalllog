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
  isCompleted: boolean;
  learnedAt: string;
  nextReviewAt: string;
};

const ymd = (iso: string) => iso.slice(0, 10);

const dayLabel = (key: string) => {
  const d = new Date(`${key}T00:00:00`);
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "今日";
  if (diff === 1) return "昨日";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

export default function RecordsPage() {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/study-logs");
    if (res.ok) {
      const d = (await res.json()) as ApiResponse<StudyLog[]>;
      setLogs(d.payload);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (id: string) => {
    const res = await apiFetch(`/api/study-logs/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  const edit = async (log: StudyLog) => {
    const nt = window.prompt("やったことを編集", log.title);
    if (nt === null) return;
    const title = nt.trim();
    if (!title) return;
    const res = await apiFetch(`/api/study-logs/${log.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: log.content, tag: log.tag }),
    });
    if (res.ok) await load();
  };

  const tags = Array.from(new Set(logs.map((l) => l.tag).filter(Boolean)));

  const filtered = logs.filter(
    (l) =>
      (!q || l.title.includes(q) || l.tag.includes(q) || l.content.includes(q)) &&
      (!activeTag || l.tag === activeTag),
  );

  const groups = new Map<string, StudyLog[]>();
  for (const l of filtered) {
    const k = ymd(l.learnedAt);
    const arr = groups.get(k) ?? [];
    arr.push(l);
    groups.set(k, arr);
  }
  const dayKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

  const dots = (stage: number) => (
    <span className="stage-dots" title={`段階 ${stage + 1}`}>
      {REVIEW_INTERVALS_DAYS.map((_, i) => (
        <span key={i} className={`d ${i <= stage ? "on" : ""}`} />
      ))}
    </span>
  );

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="eyebrow">やったこと</div>
      <h1>やったことリスト</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        これまで記録した勉強の一覧です。日付ごとにまとまっています。
      </p>

      {/* 集計 */}
      <div className="rec-stats">
        <div>
          <div className="b">{logs.length}</div>
          <div className="s">記録した合計</div>
        </div>
        <div>
          <div className="b">{logs.filter((l) => l.isCompleted).length}</div>
          <div className="s">習得済み</div>
        </div>
        <div>
          <div className="b">{tags.length}</div>
          <div className="s">タグ数</div>
        </div>
      </div>

      <div className="field" style={{ marginTop: 6 }}>
        <input
          type="text"
          value={q}
          placeholder="🔍 やったこと・タグで検索"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* タグ絞り込み */}
      {tags.length > 0 && (
        <div className="tag-filters">
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            タグ：
          </span>
          <button
            className={`tag ${activeTag === "" ? "" : "off"}`}
            onClick={() => setActiveTag("")}
          >
            すべて
          </button>
          {tags.map((t) => (
            <button
              key={t}
              className={`tag ${activeTag === t ? "" : "off"}`}
              onClick={() => setActiveTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* 一覧 */}
      {loading ? (
        <p className="spinner">読み込み中…</p>
      ) : dayKeys.length === 0 ? (
        <div className="panel center">
          <p className="muted" style={{ margin: 0 }}>
            {q || activeTag
              ? "該当する記録がありません。"
              : "まだ記録がありません。ホームから記録してみましょう。"}
          </p>
        </div>
      ) : (
        <div className="panel">
          {dayKeys.map((key) => (
            <div key={key} className="day-row">
              <div className="day-badge">
                <div className="dd">{new Date(`${key}T00:00:00`).getDate()}</div>
                <div className="dm">
                  {new Date(`${key}T00:00:00`).getMonth() + 1}月
                </div>
              </div>
              <div className="day-items">
                <div className="day-label">
                  {dayLabel(key)}（{groups.get(key)!.length}件）
                </div>
                {groups.get(key)!.map((l) => (
                  <div key={l.id} className="rec-item">
                    <div className="rec-sent">
                      {l.title}
                      <span className="muted"> の勉強をした</span>
                      {l.tag && (
                        <span className="tag" style={{ marginLeft: 6 }}>
                          {l.tag}
                        </span>
                      )}
                      {l.isCompleted && (
                        <span
                          className="badge badge-active"
                          style={{ marginLeft: 6 }}
                        >
                          習得済み
                        </span>
                      )}
                    </div>
                    <div className="rec-right">
                      {dots(l.stage)}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => edit(l)}
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
