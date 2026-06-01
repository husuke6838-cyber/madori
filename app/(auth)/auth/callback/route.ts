import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * メール確認・OAuth コールバック。
 *
 * Supabase が送るリンク `?code=xxx` を session に交換し:
 *  - 表示名 (user_metadata.display_name) が未設定なら /welcome へ
 *    （新規登録の最初の確認直後など）
 *  - 既に設定済みなら ?next= か / へ
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeNext(url.searchParams.get("next")) ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "リンクの有効期限が切れています。もう一度サインアップしてください。"
        )}`,
        url.origin
      )
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = (user?.user_metadata as Record<string, unknown>) ?? {};
  const hasName =
    typeof meta.display_name === "string" && meta.display_name.trim() !== "";

  if (!hasName) {
    // 表示名未設定 → ようこそ画面へ（next は引き継ぐ）
    const welcomeUrl = new URL("/welcome", url.origin);
    if (next !== "/") welcomeUrl.searchParams.set("next", next);
    return NextResponse.redirect(welcomeUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

function sanitizeNext(v: string | null): string | null {
  if (!v) return null;
  if (!v.startsWith("/") || v.startsWith("//")) return null;
  return v;
}
