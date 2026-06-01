"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "メールアドレスとパスワードを入力してください"
      )}${nextSuffix(next)}`
    );
  }
  if (password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "パスワードは8文字以上にしてください"
      )}${nextSuffix(next)}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const hdrs = await headers();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${hdrs.get("host")}`;

  // メール確認後のリダイレクト先（next を引き継ぐ）
  const callbackUrl = new URL("/auth/callback", origin);
  if (next) callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callbackUrl.toString() },
  });

  if (error) {
    redirect(
      `/signup?error=${encodeURIComponent(error.message)}${nextSuffix(next)}`
    );
  }

  if (!data.session) {
    redirect(
      `/login?notice=${encodeURIComponent(
        "確認メールを送信しました。受信箱のリンクをクリックしてからログインしてください。"
      )}${nextSuffix(next)}`
    );
  }

  revalidatePath("/", "layout");
  redirect(next ?? "/");
}

function sanitizeNext(v: string): string | null {
  if (!v) return null;
  if (!v.startsWith("/") || v.startsWith("//")) return null;
  return v;
}

function nextSuffix(next: string | null) {
  return next ? `&next=${encodeURIComponent(next)}` : "";
}
