import { SignJWT, jwtVerify } from "jose";
import { AUTH } from "@/config/auth";
import type { JwtPayload } from "@/app/_types";

// 秘密鍵は環境変数からのみ取得する（ソースコードに直書きしない）。
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET が未設定、または短すぎます（16文字以上必要）。",
    );
  }
  return new TextEncoder().encode(secret);
};

/** アクセストークン（JWT）を生成する。ペイロードにユーザ情報＋署名を内包する。 */
export const createAccessToken = async (payload: JwtPayload) => {
  const secret = getSecret();
  return await new SignJWT({ ...payload, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH.accessTokenMaxAgeSec}s`)
    .sign(secret);
};

/** リフレッシュトークンを生成する。中身は最小限（id のみ）。 */
export const createRefreshToken = async (userId: string) => {
  const secret = getSecret();
  return await new SignJWT({ id: userId, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH.refreshTokenMaxAgeSec}s`)
    .sign(secret);
};

/**
 * アクセストークンを検証する。
 * 署名が正しく、有効期限内であればペイロードを返す。
 * この処理はデータベースにアクセスしない（JWT の自己完結型の特性）。
 */
export const verifyAccessToken = async (
  token: string,
): Promise<JwtPayload | null> => {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    if (payload.typ !== "access") return null;
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "USER" | "ADMIN",
    };
  } catch {
    // 署名不正・改竄・期限切れなど
    return null;
  }
};

/** リフレッシュトークンを検証し、userId を返す。 */
export const verifyRefreshToken = async (
  token: string,
): Promise<string | null> => {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    if (payload.typ !== "refresh") return null;
    return payload.id as string;
  } catch {
    return null;
  }
};
