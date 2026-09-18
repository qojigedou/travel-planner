import { Star } from "lucide-react";
import { useState } from "react";
import { cx } from "../../lib/cx";

const STARS = [1, 2, 3, 4, 5];

export const scoreToStars = (score: number | null) => (score == null ? 0 : Math.round(score * 5));
export const starsToScore = (stars: number) => (stars === 0 ? null : stars / 5);

export function StarDisplay({ score, className }: { score: number | null; className?: string }) {
  const stars = scoreToStars(score);
  if (!stars) return null;
  return (
    <span className={cx("inline-flex items-center gap-0.5", className)} aria-label={`Rated ${stars} of 5`}>
      {STARS.map((n) => (
        <Star key={n} className={cx("size-3.5", n <= stars ? "fill-star text-star" : "fill-star-empty text-star-empty")} aria-hidden />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (stars: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex" onMouseLeave={() => setHover(0)}>
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(value === n ? 0 : n)}
            className="grid size-9 place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
          >
            <Star
              className={cx(
                "size-6 transition-colors duration-150",
                n <= shown ? "fill-star text-star" : "fill-transparent text-border-strong",
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-[13px] text-fg-muted">{value ? `${value} / 5` : "Not rated"}</span>
    </div>
  );
}
