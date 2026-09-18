export function Logo({ compact = false, responsive = false }: { compact?: boolean; responsive?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className={compact ? "size-5" : "size-8"} aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M16 6.5c-4.4 0-8 3.4-8 7.7 0 5.8 8 11.3 8 11.3s8-5.5 8-11.3c0-4.3-3.6-7.7-8-7.7Z"
          className="fill-primary-fg"
        />
        <circle cx="16" cy="14" r="2.9" className="fill-primary" />
      </svg>
      {!compact && (
        <span
          className={`font-display text-[21px] font-semibold tracking-tight text-fg ${responsive ? "max-[480px]:hidden" : ""}`}
          style={{ fontVariationSettings: '"SOFT" 100' }}>
          Waypoint
        </span>
      )}
    </span>
  );
}
