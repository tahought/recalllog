"use client";

import { evaluatePasswordStrength } from "@/libs/passwordStrength";

const COLORS = ["#ff6b6b", "#ff9f45", "#ffcf5c", "#9ede73", "#4fe0b0"];

/** パスワード強度メーター。入力に応じて4段階でバーと色を変化させる。 */
export const StrengthMeter = ({ password }: { password: string }) => {
  const { score, label } = evaluatePasswordStrength(password);
  const color = COLORS[score];

  return (
    <div aria-live="polite">
      <div className="meter">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="seg"
            style={{ background: i <= score && password ? color : undefined }}
          />
        ))}
      </div>
      {password && (
        <div className="meter-label" style={{ color }}>
          強度: {label}
        </div>
      )}
    </div>
  );
};
