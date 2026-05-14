import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent-blue text-white hover:bg-blue-600 disabled:bg-blue-300",
  secondary: "border border-line bg-bg-card text-ink-primary hover:bg-bg-hover",
  ghost: "text-ink-secondary hover:bg-bg-hover hover:text-ink-primary",
  danger: "border border-line text-accent-red hover:bg-red-50",
};
const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-line-focus disabled:cursor-not-allowed disabled:opacity-70",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    />
  );
});
