import { Link2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useCreateStop, useUpdateStop } from "../../api/geopoints";
import { ApiError, errorMessage } from "../../lib/api";
import { todayISO } from "../../lib/format";
import type { GeoPoint, GeoStatus } from "../../lib/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, Input } from "../ui/Field";
import { Segmented } from "../ui/Segmented";
import { StarInput, scoreToStars, starsToScore } from "../ui/StarRating";

interface StopFormDialogProps {
  open: boolean;
  onClose: () => void;
  tripId?: number;
  stop?: GeoPoint;
}

export function StopFormDialog({ open, onClose, tripId, stop }: StopFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={stop ? "Edit stop" : "Add a stop"}
      description={stop ? stop.name : "A place you want to see, eat at, or sleep in."}
    >
      <StopForm stop={stop} tripId={tripId} onDone={onClose} />
    </Dialog>
  );
}

interface FormState {
  name: string;
  link: string;
  status: GeoStatus;
  stars: number;
  date: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function StopForm({ stop, tripId, onDone }: { stop?: GeoPoint; tripId?: number; onDone: () => void }) {
  const create = useCreateStop();
  const update = useUpdateStop();
  const [errors, setErrors] = useState<Errors>({});
  const [values, setValues] = useState<FormState>({
    name: stop?.name ?? "",
    link: stop?.geo_link ?? "",
    status: stop?.status ?? "Not Visited",
    stars: scoreToStars(stop?.score ?? null),
    date: stop?.addition_date ?? todayISO(),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Name the place.";
    if (values.link.length > 3000) next.link = "Links are limited to 256 characters.";
    if (values.link && !/^https?:\/\//i.test(values.link)) next.link = "Use a full link starting with http(s)://";
    if (!values.date) next.date = "Pick a date.";
    return next;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const base = {
      name: values.name.trim(),
      geo_link: values.link.trim() || null,
      status: values.status,
      score: starsToScore(values.stars),
      addition_date: values.date,
    };

    try {
      if (stop) {
        await update.mutateAsync({ id: stop.id, patch: base });
        toast.success("Stop updated");
      } else {
        await create.mutateAsync({
          ...base,
          geo_latitude: null, // the backend fills these from geo_link
          geo_longitude: null,
          trip_id: tripId ?? null,
        });
        toast.success(`Added ${base.name}`);
      }
      onDone();
    } catch (error) {
      if (error instanceof ApiError) {
        const f = error.fields;
        setErrors({ name: f.name, link: f.geo_link, date: f.addition_date });
      }
      toast.error(errorMessage(error));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Place" error={errors.name}>
        {(props) => (
          <Input
            {...props}
            autoFocus
            maxLength={256}
            placeholder="Time Out Market"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        )}
      </Field>

      <Field
        label="Map link"
        optional
        error={errors.link}
        hint="Paste a Google Maps link and we'll find the location automatically."
      >
        {(props) => (
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <Input
              {...props}
              type="url"
              inputMode="url"
              className="pl-10"
              placeholder="https://maps.google.com/…"
              value={values.link}
              onChange={(e) => set("link", e.target.value)}
            />
          </div>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Status</span>
          <Segmented<GeoStatus>
            label="Visit status"
            value={values.status}
            onChange={(status) => set("status", status)}
            options={[
              { value: "Not Visited", label: "To visit" },
              { value: "Visited", label: "Visited" },
            ]}
            className="w-full"
          />
        </div>
        <Field label="Added on" error={errors.date}>
          {(props) => <Input {...props} type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />}
        </Field>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold">Rating</span>
        <StarInput value={values.stars} onChange={(stars) => set("stars", stars)} />
      </div>

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending || update.isPending}>
          {stop ? "Save changes" : "Add stop"}
        </Button>
      </div>
    </form>
  );
}
