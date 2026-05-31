import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

/**
 * Next.js 16 で `middleware` から `proxy` にリネームされた仕組み。
 * 全リクエストで Supabase の Auth Cookie を必要に応じてリフレッシュする。
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 以下を除く全パス：
     *  - 静的ファイル / 画像最適化 / favicon / manifest
     *  - 認証不要の公開閲覧 (/share)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|share|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
