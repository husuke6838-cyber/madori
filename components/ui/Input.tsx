import { cn } from "@/lib/ui";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3.5 py-3 text-[15px] bg-surface text-ink",
        "rounded-[var(--radius-btn)] border border-line",
        "placeholder:text-ink-faint",
        "focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay-soft",
        "tap-44",
        className
      )}
      {...rest}
    />
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold tracking-wider text-ink-soft mb-1.5"
    >
      {children}
    </label>
  );
}
