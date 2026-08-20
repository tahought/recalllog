"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_contexts/AuthContext";

/**
 * 管理エリアの認可ガード（ADMIN 専用）。
 * 一般ユーザや未認証ユーザがアクセスしても弾く。
 * サーバ側 API（/api/admin/*）でも role を検証しているため二重に保護される。
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "ADMIN") {
      router.replace("/member/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 56 }}>
        <p className="spinner">認証状態を確認中…</p>
      </div>
    );
  }
  if (!user || user.role !== "ADMIN") return null;

  return <>{children}</>;
}
