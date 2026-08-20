"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_contexts/AuthContext";

export const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="site-header">
      <div className="container bar">
        <Link href="/" className="brand">
          <span className="dot" />
          RecallLog
          <span className="mono">SRS</span>
        </Link>
        <nav className="nav">
          {user ? (
            <>
              <Link href="/member/dashboard">ホーム</Link>
              <Link href="/member/records">やったこと</Link>
              <Link href="/member/calendar">カレンダー</Link>
              <Link href="/member/account">アカウント</Link>
              {user.role === "ADMIN" && <Link href="/admin">管理</Link>}
              <span className="who">
                {user.name}
                {user.role === "ADMIN" && " · ADMIN"}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login">ログイン</Link>
              <Link href="/signup" className="btn btn-sm">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
