import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * メール確認・OAuth コールバック。
 * Supabase が送るリンク `?code=xxx` を session に交換し、
 * 検証後にトップへリダイレクトする。
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "リンクの有効期限が切れています。もう一度サインアップしてください。"
        )}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(new URL("/login", url.origin));
}
