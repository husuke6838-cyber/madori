"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isValidTheme,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
} from "@/lib/theme";

/**
 * テーマを保存。
 * - user_metadata.theme に保存（恒久）
 * - Cookie `__theme` も即時更新（SSR で次のレンダから反映）
 * - 全レイアウトを revalidate（既に開いているタブも次のナビで反映）
 */
export async function setThemeAction(theme: string) {
  if (!isValidTheme(theme)) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.auth.updateUser({ data: { theme } });
  }

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, {
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
}
