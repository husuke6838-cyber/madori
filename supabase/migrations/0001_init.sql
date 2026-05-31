-- =========================================================
-- いえづくりノート - 初期スキーマ
-- Phase 1: projects, members, invites, rooms, items, ratings,
--          item_images, item_links, item_revisions, share_links
-- Phase 2 で使うもの: floorplans
-- Phase 3 で使うもの: meeting_logs
-- すべて先に定義しておく（後から ALTER しなくて済むように）
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. projects（ユーザーから見た「ルーム」= 1家づくり）
-- =========================================================
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index projects_owner_idx on public.projects(owner_id);

-- =========================================================
-- 2. project_members
--    家族（★評価対象 / 表示名 / 色）。
--    user_id があれば「アカウント参加済み」、null なら名前のみ。
-- =========================================================
create table public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null check (char_length(name) between 1 and 40),
  color       text not null,
  role        text not null default 'editor'
              check (role in ('owner','editor','viewer')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index project_members_project_idx on public.project_members(project_id);
create unique index project_members_user_unique
  on public.project_members(project_id, user_id)
  where user_id is not null;

-- =========================================================
-- 3. project_invites（招待リンク / 永続・複数人利用可）
-- =========================================================
create table public.project_invites (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  token       text not null unique,
  email       text,
  role        text not null default 'editor'
              check (role in ('editor','viewer')),
  created_by  uuid references auth.users(id) on delete set null,
  expires_at  timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index project_invites_project_idx on public.project_invites(project_id);

-- =========================================================
-- 4. rooms（家の中の部屋カテゴリ）
-- =========================================================
create table public.rooms (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 40),
  subtitle     text,
  kind         text not null default 'place'
               check (kind in ('place','overall')),
  desired_jou  numeric(5,2),
  no_request   boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index rooms_project_sort_idx on public.rooms(project_id, sort_order);

-- =========================================================
-- 5. items（要望）
-- =========================================================
create table public.items (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 500),
  memo        text check (memo is null or char_length(memo) <= 2000),
  spec_model  text check (spec_model is null or char_length(spec_model) <= 200),
  sort_order  int not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index items_room_sort_idx on public.items(room_id, sort_order);

-- =========================================================
-- 6. item_revisions（変更履歴 / 取り消し線表示用）
-- =========================================================
create table public.item_revisions (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  prev_text   text not null,
  changed_by  uuid references auth.users(id) on delete set null,
  changed_at  timestamptz not null default now()
);
create index item_revisions_item_idx on public.item_revisions(item_id, changed_at desc);

-- =========================================================
-- 7. ratings（家族★ 0〜3）
-- =========================================================
create table public.ratings (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  member_id   uuid not null references public.project_members(id) on delete cascade,
  stars       int  not null check (stars between 0 and 3),
  updated_at  timestamptz not null default now(),
  unique(item_id, member_id)
);
create index ratings_item_idx on public.ratings(item_id);

-- =========================================================
-- 8. item_images / item_links
-- =========================================================
create table public.item_images (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references public.items(id) on delete cascade,
  storage_path  text not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index item_images_item_idx on public.item_images(item_id);

create table public.item_links (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  url         text not null,
  og_title    text,
  og_image    text,
  og_desc     text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index item_links_item_idx on public.item_links(item_id);

-- =========================================================
-- 9. floorplans（Phase 2 / 1プロジェクトあたり最大5個）
-- =========================================================
create table public.floorplans (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 40),
  grid_unit_mm  int  not null default 910,
  data          jsonb not null default '{}'::jsonb,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index floorplans_project_sort_idx on public.floorplans(project_id, sort_order);

create or replace function public.enforce_floorplan_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.floorplans where project_id = new.project_id) >= 5 then
    raise exception 'floorplan limit reached (max 5 per project)'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger trg_floorplan_limit
  before insert on public.floorplans
  for each row execute function public.enforce_floorplan_limit();

-- =========================================================
-- 10. meeting_logs（Phase 3）
-- =========================================================
create table public.meeting_logs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  log_date    date not null,
  title       text not null check (char_length(title) between 1 and 120),
  said_us     text,
  said_them   text,
  status      text not null default 'done'
              check (status in ('done','planned')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index meeting_logs_project_date_idx on public.meeting_logs(project_id, log_date desc);

-- =========================================================
-- 11. share_links（非ログイン閲覧トークン / 計画書）
-- =========================================================
create table public.share_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  token       text not null unique,
  revoked_at  timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index share_links_project_idx on public.share_links(project_id);

-- =========================================================
-- updated_at 自動更新トリガ
-- =========================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_projects_touch    before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger trg_items_touch       before update on public.items
  for each row execute function public.touch_updated_at();
create trigger trg_floorplans_touch  before update on public.floorplans
  for each row execute function public.touch_updated_at();
create trigger trg_ratings_touch     before update on public.ratings
  for each row execute function public.touch_updated_at();

-- =========================================================
-- ヘルパ関数：自分が当該プロジェクトのメンバーか
--   - owner（projects.owner_id = auth.uid()）
--   - project_members に自分の user_id が紐付いている
-- =========================================================
create or replace function public.is_project_member(pid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.projects p
      where p.id = pid and p.owner_id = auth.uid()
  ) or exists(
    select 1 from public.project_members m
      where m.project_id = pid and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_project_member(uuid) from public;
grant execute on function public.is_project_member(uuid) to authenticated;

-- =========================================================
-- RLS 有効化
-- =========================================================
alter table public.projects         enable row level security;
alter table public.project_members  enable row level security;
alter table public.project_invites  enable row level security;
alter table public.rooms            enable row level security;
alter table public.items            enable row level security;
alter table public.item_revisions   enable row level security;
alter table public.ratings          enable row level security;
alter table public.item_images      enable row level security;
alter table public.item_links       enable row level security;
alter table public.floorplans       enable row level security;
alter table public.meeting_logs     enable row level security;
alter table public.share_links      enable row level security;

-- =========================================================
-- RLS ポリシー
-- 共通方針：
--   - projects: owner_id = auth.uid() のみ create/update/delete。
--              自分がメンバーなら select 可。
--   - 配下テーブル: is_project_member(project_id) で select / write 可。
--   - 例外: project_members の delete はオーナーのみ、project_invites もオーナーのみ作成。
-- =========================================================

-- projects --------------------------------------------------
create policy projects_select on public.projects
  for select using (public.is_project_member(id));
create policy projects_insert on public.projects
  for insert with check (owner_id = auth.uid());
create policy projects_update on public.projects
  for update using (owner_id = auth.uid())
            with check (owner_id = auth.uid());
create policy projects_delete on public.projects
  for delete using (owner_id = auth.uid());

-- project_members ------------------------------------------
create policy pm_select on public.project_members
  for select using (public.is_project_member(project_id));
create policy pm_insert on public.project_members
  for insert with check (public.is_project_member(project_id));
create policy pm_update on public.project_members
  for update using (public.is_project_member(project_id))
            with check (public.is_project_member(project_id));
-- 削除はオーナーまたは本人のみ
create policy pm_delete on public.project_members
  for delete using (
    exists(select 1 from public.projects p
             where p.id = project_id and p.owner_id = auth.uid())
    or user_id = auth.uid()
  );

-- project_invites ------------------------------------------
-- オーナーのみが作成・閲覧・削除可
create policy pi_owner_all on public.project_invites
  for all using (
    exists(select 1 from public.projects p
             where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists(select 1 from public.projects p
             where p.id = project_id and p.owner_id = auth.uid())
  );

-- rooms ----------------------------------------------------
create policy rooms_all on public.rooms
  for all using (public.is_project_member(project_id))
        with check (public.is_project_member(project_id));

-- items ----------------------------------------------------
create policy items_all on public.items
  for all using (
    public.is_project_member(
      (select r.project_id from public.rooms r where r.id = room_id)
    )
  ) with check (
    public.is_project_member(
      (select r.project_id from public.rooms r where r.id = room_id)
    )
  );

-- item_revisions -------------------------------------------
create policy item_rev_all on public.item_revisions
  for all using (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  ) with check (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  );

-- ratings --------------------------------------------------
create policy ratings_all on public.ratings
  for all using (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  ) with check (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  );

-- item_images ---------------------------------------------
create policy item_images_all on public.item_images
  for all using (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  ) with check (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  );

-- item_links ----------------------------------------------
create policy item_links_all on public.item_links
  for all using (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  ) with check (
    public.is_project_member(
      (select r.project_id from public.rooms r
        join public.items i on i.room_id = r.id
        where i.id = item_id)
    )
  );

-- floorplans ----------------------------------------------
create policy floorplans_all on public.floorplans
  for all using (public.is_project_member(project_id))
        with check (public.is_project_member(project_id));

-- meeting_logs --------------------------------------------
create policy meeting_logs_all on public.meeting_logs
  for all using (public.is_project_member(project_id))
        with check (public.is_project_member(project_id));

-- share_links ---------------------------------------------
-- オーナーのみ作成/削除/閲覧。非ログイン閲覧はサーバ側 service_role で行う。
create policy share_links_owner_all on public.share_links
  for all using (
    exists(select 1 from public.projects p
             where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists(select 1 from public.projects p
             where p.id = project_id and p.owner_id = auth.uid())
  );

-- =========================================================
-- Storage バケット（画像）
-- private にして、共有時はサーバ側で署名URL発行
-- =========================================================
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', false)
on conflict (id) do nothing;

-- Storage RLS（メンバーのみ自プロジェクト配下のオブジェクトを操作可）
-- ファイル命名規約: `{project_id}/{item_id}/{filename}`
create policy item_images_storage_select on storage.objects
  for select to authenticated using (
    bucket_id = 'item-images'
    and public.is_project_member( (storage.foldername(name))[1]::uuid )
  );
create policy item_images_storage_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'item-images'
    and public.is_project_member( (storage.foldername(name))[1]::uuid )
  );
create policy item_images_storage_update on storage.objects
  for update to authenticated using (
    bucket_id = 'item-images'
    and public.is_project_member( (storage.foldername(name))[1]::uuid )
  );
create policy item_images_storage_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'item-images'
    and public.is_project_member( (storage.foldername(name))[1]::uuid )
  );
