import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDisplayName } from "@/lib/profile";

/**
 * 招待リンク受け取り。
 *
 * - 未ログインなら /login に next 付きで誘導（ログイン後/サインアップ後に戻れる）
 * - ログイン済みかつメンバー未登録なら project_members に挿入してルームへ
 * - 既にメンバー（またはオーナー）ならそのままルームへ
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  }

  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from("project_invites")
    .select("project_id, role, revoked_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.revoked_at) {
    return <InvalidNotice reason="このリンクは無効か、失効済みです。" />;
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return <InvalidNotice reason="このリンクは有効期限が切れています。" />;
  }

  const [existingRes, projectRes] = await Promise.all([
    admin
      .from("project_members")
      .select("id")
      .eq("project_id", invite.project_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("projects")
      .select("owner_id")
      .eq("id", invite.project_id)
      .maybeSingle(),
  ]);

  const isOwner = projectRes.data?.owner_id === user.id;

  if (!existingRes.data && !isOwner) {
    const { data: maxRow } = await admin
      .from("project_members")
      .select("sort_order")
      .eq("project_id", invite.project_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 設定済み表示名があれば使う、無ければメールローカル部
    const fallbackName = getDisplayName(user).slice(0, 40);

    await admin.from("project_members").insert({
      project_id: invite.project_id,
      user_id: user.id,
      name: fallbackName,
      color: "#a67c3a",
      role: invite.role,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    });
  }

  redirect(`/r/${invite.project_id}/note`);
}

function InvalidNotice({ reason }: { reason: string }) {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-clay-soft text-clay grid place-items-center text-2xl">
          ✉
        </div>
        <h1 className="font-mincho text-xl mb-2">参加できませんでした</h1>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">
          {reason}
          <br />
          リンクの発行者に新しいリンクの再発行をお願いしてください。
        </p>
        <Link
          href="/"
          className="inline-block text-clay font-bold text-sm tap-44 px-4 py-3"
        >
          マイページへ →
        </Link>
      </div>
    </main>
  );
}
