-- =========================================================
-- 間取りの PNG 書き出しパスを保持するカラム。
-- - storage path（Storage バケット内のキー）を入れる
-- - 表示時は admin client で署名URLを発行
-- =========================================================
alter table public.floorplans
  add column if not exists png_path text;
