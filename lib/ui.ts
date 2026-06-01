/**
 * 軽量な className 連結ユーティリティ。
 * clsx/twMerge を入れる必要があれば後で差し替える。
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
