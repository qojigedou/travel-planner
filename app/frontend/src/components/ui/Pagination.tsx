import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
      <Button variant="secondary" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="tabular min-w-24 text-center text-sm text-fg-muted">
        Page <span className="font-semibold text-fg">{page}</span> of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
