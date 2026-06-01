"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 表示名を更新（auth.users.user_metadata.display_name に格納）。
 * 専用テーブル無しで完結する。
 */
export async function updateDisplayNameAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/me?error=表示名を入力してください");
  }
  if (name.length > 40) {
    redirect("/me?error=表示名は40文字以内にしてください");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: name },
  });
  if (error) {
    redirect(`/me?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/me?notice=表示名を更新しました");
}
