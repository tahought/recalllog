"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/app/_hooks/apiFetch";
import type { ApiResponse } from "@/app/_types";
import type { CalendarItem } from "@/app/api/calendar/route";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const res = await apiFetch(`/api/calendar?year=${y}&month=${m}`);
    if (res.ok) {
      const d = (await res.json()) as ApiResponse<CalendarItem[]>;
      setItems(d.payload);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(year, month);
  }, [year, month, load]);

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  // 日付ごとにグルーピング
  const byDay: Record<number, CalendarItem[]> = {};
  for (const it of items) {
    const day = new Date(it.nextReviewAt).getDate();
    (byDay[day] ??= []).push(it);
  }

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === d;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="eyebrow">Calendar</div>
      <h1>復習カレンダー</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        いつ・何を復習するのかを月単位で俯瞰できます。
      </p>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="cal-head">
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}>
            ← 前の月
          </button>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
            {year}年 {month}月
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}>
            次の月 →
          </button>
        </div>

        {loading ? (
          <p className="spinner">読み込み中…</p>
        ) : (
          <>
            <div className="cal-grid" style={{ marginBottom: 6 }}>
              {DOW.map((d) => (
                <div key={d} className="cal-dow">
                  {d}
                </div>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((d, i) =>
                d === null ? (
                  <div key={`e${i}`} className="cal-cell empty" />
                ) : (
                  <div
                    key={d}
                    className={`cal-cell ${isToday(d) ? "today" : ""}`}
                  >
                    <div className="cal-date">{d}</div>
                    {(byDay[d] ?? []).slice(0, 3).map((it) => (
                      <div
                        key={it.id}
                        className={`cal-pill ${it.isOverdue ? "overdue" : ""}`}
                        title={it.title}
                      >
                        {it.title}
                      </div>
                    ))}
                    {(byDay[d]?.length ?? 0) > 3 && (
                      <div className="cal-more">
                        ほか {byDay[d].length - 3} 件
                      </div>
                    )}
                    {(byDay[d]?.length ?? 0) > 0 && (
                      <div className="cal-count">{byDay[d].length}件</div>
                    )}
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        赤いラベルは復習期限を過ぎた「延滞」項目です。ダッシュボードから復習できます。
      </p>
    </div>
  );
}
