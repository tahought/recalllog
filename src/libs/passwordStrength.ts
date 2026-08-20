/**
 * パスワード強度の簡易評価。
 * 長さと文字種の多様性からスコア(0-4)を算出する。
 * サインアップ画面の強度メーター表示に使用する。
 */
export type StrengthResult = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  percent: number;
};

export const evaluatePasswordStrength = (pw: string): StrengthResult => {
  if (!pw) return { score: 0, label: "未入力", percent: 0 };

  let points = 0;
  if (pw.length >= 10) points++;
  if (pw.length >= 14) points++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++;
  if (/[0-9]/.test(pw)) points++;
  if (/[^a-zA-Z0-9]/.test(pw)) points++;

  // 単純な繰り返しや連続はペナルティ
  if (/(.)\1{2,}/.test(pw)) points--;

  const score = Math.max(0, Math.min(4, points - 1)) as 0 | 1 | 2 | 3 | 4;
  const labels = ["とても弱い", "弱い", "普通", "強い", "とても強い"];
  return {
    score,
    label: labels[score],
    percent: ((score + 1) / 5) * 100,
  };
};
