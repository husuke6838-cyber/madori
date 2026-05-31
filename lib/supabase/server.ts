import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * RSC / Server Action / Route Handler から呼ぶ Supabase クライアント。
 * Auth Cookie を Next の cookies() で同期する。
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // RSC からの呼び出しでは setAll が無視される（middleware が refresh を担う）
          }
        },
      },
    }
  );
}
