import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Button } from "./Button";

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "animate-rise flex flex-col items-center rounded-[var(--card-radius)] border border-dashed border-border-strong px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-soft-fg">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {children && <p className="mt-2 max-w-sm text-sm text-fg-muted">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[var(--card-radius)] border border-border bg-danger-soft px-6 py-10 text-center">
      <TriangleAlert className="size-7 text-danger" aria-hidden />
      <p className="mt-3 font-semibold text-danger-soft-fg">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-lg", className)} aria-hidden />;
}
