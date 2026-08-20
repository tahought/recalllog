/**
 * 間隔反復（Spaced Repetition / 忘却曲線）のスケジューリング。
 * ------------------------------------------------------------------
 * 学んだ内容を「1日後 → 3日後 → 7日後 → 14日後 → 30日後」の順で復習する。
 * 復習時に「覚えていた」なら次の段階へ進み、間隔が伸びる。
 * 「忘れていた」なら段階を1つ戻し、早めに再復習させる。
 *
 * この間隔配列は将来ユーザーごとに設定変更できるよう、定数として分離している。
 */

// 各段階の「学習日/前回復習日からの日数」。
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

/** stage に対応する次回までの日数を返す（最終段階を超えたら最後の間隔を維持）。 */
export const daysForStage = (stage: number): number => {
  if (stage < 0) return REVIEW_INTERVALS_DAYS[0];
  if (stage >= REVIEW_INTERVALS_DAYS.length) {
    return REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1];
  }
  return REVIEW_INTERVALS_DAYS[stage];
};

/** 基準日に日数を足した Date を返す。 */
export const addDays = (base: Date, days: number): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * 新規学習ログ登録時の初回復習日を計算する。
 * 学習した当日を stage 0 とし、最初の間隔（1日後）に初回復習を設定する。
 */
export const initialSchedule = (
  learnedAt: Date = new Date(),
): { stage: number; nextReviewAt: Date } => {
  return {
    stage: 0,
    nextReviewAt: addDays(learnedAt, REVIEW_INTERVALS_DAYS[0]),
  };
};

/**
 * 復習結果を反映して次の状態を計算する。
 *  - recalled=true  : 段階を1つ進め、次の間隔で復習を予約
 *  - recalled=false : 段階を1つ戻し（最小0）、翌日に再復習
 * 最終段階を覚えきったら isCompleted=true（以降は最長間隔で維持）。
 */
export const nextSchedule = (
  currentStage: number,
  recalled: boolean,
  now: Date = new Date(),
): { stage: number; nextReviewAt: Date; isCompleted: boolean } => {
  if (!recalled) {
    const stage = Math.max(0, currentStage - 1);
    return { stage, nextReviewAt: addDays(now, 1), isCompleted: false };
  }
  const nextStage = currentStage + 1;
  const isCompleted = nextStage >= REVIEW_INTERVALS_DAYS.length;
  const cappedStage = Math.min(nextStage, REVIEW_INTERVALS_DAYS.length - 1);
  return {
    stage: cappedStage,
    nextReviewAt: addDays(now, daysForStage(cappedStage)),
    isCompleted,
  };
};

/** その日の終わり（23:59:59.999）を返す。「今日が期限」の判定に使う。 */
export const endOfToday = (now: Date = new Date()): Date => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
};
