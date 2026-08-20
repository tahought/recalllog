"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/app/_hooks/apiFetch";
import { useAuth } from "@/app/_contexts/AuthContext";
import type { ApiResponse } from "@/app/_types";
import type { DashboardStats } from "@/app/api/stats/route";
import { REVIEW_INTERVALS_DAYS } from "@/libs/srs";

type StudyLog = {
  id: string;
  title: string;
  content: string;
  tag: string;
  stage: number;
  reviewCount: number;
  nextReviewAt: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [sRes, qRes] = await Promise.all([
      apiFetch("/api/stats"),
      apiFetch("/api/study-logs?due=today"),
    ]);
    if (sRes.ok) {
      const d = (await sRes.json()) as ApiResponse<DashboardStats>;
      setStats(d.payload);
    }
    if (qRes.ok) {
      const d = (await qRes.json()) as ApiResponse<StudyLog[]>;
      setQueue(d.payload);
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
      // キューから外し、集計を更新
      setQueue((q) => q.filter((x) => x.id !== id));
      const sRes = await apiFetch("/api/stats");
      if (sRes.ok) {
        const sd = (await sRes.json()) as ApiResponse<DashboardStats>;
        setStats(sd.payload);
      }
    }
    setBusyId(null);
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="eyebrow">Dashboard</div>
      <h1>おかえりなさい、{user?.name} さん</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        今日の復習を片付けて、記憶を定着させましょう。
      </p>

      {/* 集計 */}
      <div className="stat-grid" style={{ marginTop: 20 }}>
        <div className="stat">
          <div className="n accent">{stats?.dueToday ?? "–"}</div>
          <div className="l">今日の復習</div>
        </div>
        <div className="stat">
          <div className="n">{stats?.dueTomorrow ?? "–"}</div>
          <div className="l">明日の復習</div>
        </div>
        <div className="stat">
          <div className="n">{stats?.totalActive ?? "–"}</div>
          <div className="l">学習中の項目</div>
        </div>
        <div className="stat">
          <div className="n">{stats?.totalCompleted ?? "–"}</div>
          <div className="l">習得済み</div>
        </div>
        <div className="stat">
          <div className="n">{stats ? `${stats.recallRate}%` : "–"}</div>
          <div className="l">正答率（7日間）</div>
        </div>
        <div className="stat">
          <div className="n">{stats?.reviewsLast7Days ?? "–"}</div>
          <div className="l">復習回数（7日間）</div>
        </div>
      </div>

      {/* 今日の復習キュー */}
      <div className="row-between" style={{ marginTop: 36 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>今日の復習キュー</h2>
        <Link href="/member/logs" className="btn btn-ghost btn-sm">
          学習ログを追加
        </Link>
      </div>

      {flash && (
        <div className="alert alert-ok" style={{ marginTop: 12 }}>
          {flash}
        </div>
      )}

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {loading ? (
          <p className="spinner">読み込み中…</p>
        ) : queue.length === 0 ? (
          <div className="panel center">
            <h3 style={{ marginTop: 0 }}>今日の復習は完了です 🎉</h3>
            <p className="muted">
              新しく学んだことがあれば、
              <Link href="/member/logs"> 学習ログに記録</Link>
              しておきましょう。
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
                    <span
                      key={i}
                      className={`d ${i <= log.stage ? "on" : ""}`}
                    />
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
    </div>
  );
}
