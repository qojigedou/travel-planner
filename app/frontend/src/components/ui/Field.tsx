import { CircleAlert } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";

export const inputClass =
  "h-[var(--input-height)] w-full rounded-[var(--input-radius)] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 text-[15px] text-fg " +
  "placeholder:text-[var(--input-placeholder)] shadow-xs transition-[border-color,box-shadow] duration-150 " +
  "hover:border-[var(--input-border-hover)] focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15 " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/15 disabled:opacity-60";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
}

export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-semibold text-fg">
        {label}
        {optional && <span className="text-xs font-normal text-fg-subtle">Optional</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-[13px] text-danger">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx(inputClass, className)} {...props} />;
});
