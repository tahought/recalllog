"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_contexts/AuthContext";

/**
 * 会員エリアの認可ガード。
 * 未認証（サイレントリフレッシュも失敗）ならログイン画面へ誘導する。
 * ※ これはあくまで UX 上のガードであり、本質的な保護は各 API 側で行う。
 */
export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 56 }}>
        <p className="spinner">認証状態を確認中…</p>
      </div>
    );
  }
  if (!user) return null;

  return <>{children}</>;
}
