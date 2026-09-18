import { Compass } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/States";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <EmptyState icon={<Compass className="size-7" />} title="Off the map" action={<ButtonLink to="/">Back to trips</ButtonLink>}>
        There's nothing at this address. Let's get you back on route.
      </EmptyState>
    </div>
  );
}
