import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isValidTheme,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
} from "../theme";

/**
 * 認証トークンの自動リフレッシュ + テーマ Cookie の同期。
 * すべてのリクエストで Supabase の Auth Cookie を必要に応じて更新する。
 * 同時に user_metadata.theme を `__theme` Cookie に反映して
 * RootLayout が SSR で <html data-theme> を即セットできるようにする。
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user_metadata.theme と Cookie を同期
  const meta = (user?.user_metadata as Record<string, unknown> | null) ?? null;
  const userTheme = meta && typeof meta.theme === "string" ? meta.theme : null;
  const cookieTheme = request.cookies.get(THEME_COOKIE)?.value ?? null;

  if (userTheme && isValidTheme(userTheme) && userTheme !== cookieTheme) {
    response.cookies.set(THEME_COOKIE, userTheme, {
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
