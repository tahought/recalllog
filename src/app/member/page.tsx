import { redirect } from "next/navigation";

/** 会員トップは常にダッシュボードへ。 */
export default function MemberIndex() {
  redirect("/member/dashboard");
}
