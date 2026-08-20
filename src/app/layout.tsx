import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "./_contexts/AuthContext";
import { Header } from "./_components/Header";

export const metadata: Metadata = {
  title: "RecallLog — 忘却曲線で復習する学習ログ",
  description: "学んだことを記録すると、忘却曲線に沿って復習日を提案します。",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // middleware が発行した nonce を取得（Next.js が <script> に自動付与する）
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
        {/* nonce を参照して動的レンダリングを保証（CSP 適用のため） */}
        {nonce ? <span data-nonce={nonce} style={{ display: "none" }} /> : null}
      </body>
    </html>
  );
}
