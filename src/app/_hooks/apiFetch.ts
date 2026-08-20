/**
 * 認証付き fetch のラッパー。
 * 401（アクセストークン期限切れ）を受けたら /api/refresh を一度だけ試み、
 * 成功したら元のリクエストを再実行する（サイレントリフレッシュ）。
 *
 * Cookie は HttpOnly のため JS からは触らない。ブラウザが自動送信する。
 */
export const apiFetch = async (
  input: string,
  init?: RequestInit,
): Promise<Response> => {
  const opts: RequestInit = { cache: "no-store", ...init };
  let res = await fetch(input, opts);

  if (res.status === 401) {
    const r = await fetch("/api/refresh", { method: "POST" });
    if (r.ok) {
      res = await fetch(input, opts); // リフレッシュ後に再試行
    }
  }
  return res;
};
