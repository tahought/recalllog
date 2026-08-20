/**
 * 認証方式の設定。
 * ------------------------------------------------------------------
 * 本アプリは「トークンベース認証 (JWT)」を採用している。
 *
 * ただし、JWT を LocalStorage に保存すると
 * XSS 攻撃で容易に流出してしまう（LocalStorage には HttpOnly のような
 * 保護機構がないため）。
 *
 * そこで本アプリでは JWT を「HttpOnly + Secure + SameSite=Strict」な
 * Cookie に載せて送受信することで、
 *   - JWT の自己完結型トークンとしての利点（DB 問い合わせ不要な認証・認可）
 *   - Cookie の HttpOnly 属性による XSS 耐性
 * の両方を得る構成としている。
 */

export const AUTH = {
  mode: "jwt",
  // JWT（アクセストークン）の有効期限。短めに設定し、リフレッシュで更新する。
  accessTokenMaxAgeSec: 60 * 15, // 15分
  // リフレッシュトークン（サイレントリフレッシュ用）の有効期限。
  refreshTokenMaxAgeSec: 60 * 60 * 24 * 7, // 7日
} as const;

// Cookie 名
export const COOKIE = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
} as const;

// レートリミットの設定
export const RATE_LIMIT = {
  // 直近 windowMin 分の間に maxFailures 回失敗するとロックする
  windowMin: 10,
  maxFailures: 5,
} as const;
