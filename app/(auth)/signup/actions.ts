"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signup?error=メールアドレスとパスワードを入力してください");
  }
  if (password.length < 8) {
    redirect("/signup?error=パスワードは8文字以上にしてください");
  }

  const supabase = await createSupabaseServerClient();
  const hdrs = await headers();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${hdrs.get("host")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    // メール確認が必要なケース
    redirect(
      `/login?notice=${encodeURIComponent(
        "確認メールを送信しました。受信箱のリンクをクリックしてからログインしてください。"
      )}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}
