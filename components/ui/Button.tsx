import { cn } from "@/lib/ui";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-clay text-white shadow-[0_4px_12px_rgba(189,93,58,0.32)] hover:brightness-[0.96] active:brightness-[0.92]",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-2",
  outline:
    "bg-surface text-ink border border-line hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm rounded-[var(--radius-btn)] font-bold tap-44",
  lg: "px-5 py-3 text-[15px] rounded-[var(--radius-btn)] font-bold tap-44",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  );
}
