"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { PublicUser, ApiResponse } from "@/app/_types";

type AuthState = {
  user: PublicUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * 認証状態のグローバル管理。
 *
 * JWT は HttpOnly Cookie に入っているため JavaScript からは読めない。
 * そのため「現在誰でログインしているか」は /api/me に問い合わせて取得する。
 *
 * サイレントリフレッシュ：
 *   /api/me が 401（アクセストークン期限切れ）を返したら、
 *   /api/refresh を一度だけ叩いてトークンを更新し、再度 /api/me を試みる。
 *   これによりユーザは再ログインなしでセッションを継続できる。
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (): Promise<PublicUser | null> => {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as ApiResponse<PublicUser>;
      return data.payload;
    }
    return null;
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      let me = await fetchMe();
      if (!me) {
        // アクセストークン期限切れの可能性 → サイレントリフレッシュを試行
        const r = await fetch("/api/refresh", { method: "POST" });
        if (r.ok) {
          me = await fetchMe();
        }
      }
      setUser(me);
    } finally {
      setLoading(false);
    }
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth は AuthProvider の内側で使用してください。");
  return ctx;
};
