"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent(
        "メールアドレスとパスワードを入力してください"
      )}${nextSuffix(next)}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg =
      error.message === "Invalid login credentials"
        ? "メールアドレスかパスワードが違います"
        : error.message;
    redirect(`/login?error=${encodeURIComponent(msg)}${nextSuffix(next)}`);
  }

  revalidatePath("/", "layout");
  redirect(next ?? "/");
}

/**
 * オープンリダイレクト対策：相対パスのみ許可。
 */
function sanitizeNext(v: string): string | null {
  if (!v) return null;
  if (!v.startsWith("/") || v.startsWith("//")) return null;
  return v;
}

function nextSuffix(next: string | null) {
  return next ? `&next=${encodeURIComponent(next)}` : "";
}
