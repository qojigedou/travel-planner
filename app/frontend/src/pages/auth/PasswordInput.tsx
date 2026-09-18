import { Check, Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { PASSWORD_RULES } from "../../api/auth";
import { Input } from "../../components/ui/Field";
import { cx } from "../../lib/cx";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-fg-subtle transition-colors hover:text-fg"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}

export function PasswordRules({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.label} className={cx("flex items-center gap-1.5 transition-colors duration-200", ok ? "text-success" : "text-fg-subtle")}>
            <span
              className={cx(
                "grid size-4 place-items-center rounded-full border transition-all duration-200",
                ok ? "border-transparent bg-success text-done-contrast" : "border-border-strong",
              )}
            >
              <Check className={cx("size-2.5 transition-transform duration-200", ok ? "scale-100" : "scale-0")} strokeWidth={3} />
            </span>
            {rule.label}
            <span className="sr-only">{ok ? "met" : "not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}
