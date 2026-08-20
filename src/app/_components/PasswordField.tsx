"use client";

import { useState, forwardRef, InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/**
 * パスワード入力欄（表示/非表示トグル付き）。
 * type を text/password で切り替えることで平文表示を可能にする。
 */
export const PasswordField = forwardRef<HTMLInputElement, Props>(
  function PasswordField({ label, error, id, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <div className="pw-wrap">
          <input
            id={id}
            ref={ref}
            type={visible ? "text" : "password"}
            autoComplete="off"
            {...rest}
          />
          <button
            type="button"
            className="pw-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "パスワードを隠す" : "パスワードを表示"}
          >
            {visible ? "隠す" : "表示"}
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  },
);
