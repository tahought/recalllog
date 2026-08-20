import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./_contexts/AuthContext";
import { Header } from "./_components/Header";

export const metadata: Metadata = {
  title: "RecallLog — 忘却曲線で復習する学習ログ",
  description: "学んだことを記録すると、忘却曲線に沿って復習日を提案します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
