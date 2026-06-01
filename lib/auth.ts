import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * 認証必須ページの先頭で呼ぶ。
 * 未ログインなら /login へリダイレクトする。
 */
export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
