"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setupProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const next = sanitizeNext(String(formData.get("next") ?? ""));

  if (name) {
    if (name.length > 40) {
      redirect(
        `/welcome?error=${encodeURIComponent("表示名は40文字以内にしてください")}${nextSuffix(next)}`
      );
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    });
    if (error) {
      redirect(
        `/welcome?error=${encodeURIComponent(error.message)}${nextSuffix(next)}`
      );
    }
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
