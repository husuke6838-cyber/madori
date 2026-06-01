import type { User } from "@supabase/supabase-js";

/**
 * ユーザの表示名を取得する。
 * - user_metadata.display_name が設定されていればそれ
 * - 無ければメールのローカル部（@より前）
 */
export function getDisplayName(user: { user_metadata?: Record<string, unknown>; email?: string | null } | User): string {
  const meta = user.user_metadata ?? {};
  const name = typeof meta.display_name === "string" ? meta.display_name.trim() : "";
  if (name) return name;
  if (user.email) return user.email.split("@")[0] ?? "ゲスト";
  return "ゲスト";
}
