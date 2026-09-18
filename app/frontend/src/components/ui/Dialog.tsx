import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../../lib/cx";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

const EXIT_MS = 240;

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      setMounted(true);
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cx(
        "wp-dialog m-auto w-[calc(100%-2rem)] max-w-lg overflow-visible rounded-[var(--dialog-radius)] bg-transparent p-0 text-fg",
        className,
      )}
    >
      {mounted && (
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[var(--dialog-radius)] border border-border bg-[var(--dialog-bg)] shadow-[var(--dialog-shadow)]">
          <header className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-7 sm:pt-7">
            <div>
              <h2 id={titleId} className="text-2xl font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              <X className="size-[18px]" />
            </button>
          </header>
          <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7">{children}</div>
        </div>
      )}
    </dialog>
  );
}
