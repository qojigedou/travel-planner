import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cx } from "../../lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ink";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--btn-radius)] font-semibold " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-xs hover:bg-[var(--btn-primary-bg-hover)]",
  secondary:
    "border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)] shadow-xs hover:bg-[var(--btn-secondary-bg-hover)]",
  ghost: "text-fg-muted hover:bg-[var(--btn-ghost-bg-hover)] hover:text-fg",
  danger: "bg-[var(--btn-danger-bg)] text-[var(--btn-danger-fg)] shadow-xs hover:bg-[var(--btn-danger-bg-hover)]",
  ink: "bg-ink text-ink-fg shadow-xs hover:bg-ink-hover",
};

const sizes: Record<Size, string> = {
  sm: "h-[var(--btn-height-sm)] px-3.5 text-[13px]",
  md: "h-[var(--btn-height-md)] px-5 text-sm",
  lg: "h-[var(--btn-height-lg)] px-7 text-[15px]",
  icon: "size-[var(--btn-height-md)] text-sm",
  "icon-sm": "size-[var(--btn-height-sm)] text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cx(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, loading, icon, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className as string)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
