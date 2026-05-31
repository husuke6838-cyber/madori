import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service_role キーを使うサーバ専用クライアント。
 * RLS をバイパスして DB を読み書きできるため、絶対にクライアントへ送らない。
 * 用途: /share/[token] の非ログイン閲覧、招待トークンの検証など。
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
