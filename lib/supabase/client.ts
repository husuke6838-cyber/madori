"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ（Client Components）から呼ぶ Supabase クライアント。
 * シングルトン的にモジュールスコープで1つ持つ。
 */
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}
