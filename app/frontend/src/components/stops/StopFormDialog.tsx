import { CircleCheck, Link2, LocateFixed } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useCreateStop, useUpdateStop } from "../../api/geopoints";
import { ApiError, errorMessage } from "../../lib/api";
import { todayISO } from "../../lib/format";
import { coordsFromMapLink } from "../../lib/hooks";
import type { GeoPoint, GeoPointInput, GeoStatus } from "../../lib/types";
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
  lat: string;
  lng: string;
  status: GeoStatus;
  stars: number;
  date: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function StopForm({ stop, tripId, onDone }: { stop?: GeoPoint; tripId?: number; onDone: () => void }) {
  const create = useCreateStop();
  const update = useUpdateStop();
  const [linkFound, setLinkFound] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [values, setValues] = useState<FormState>({
    name: stop?.name ?? "",
    link: stop?.geo_link ?? "",
    lat: stop?.geo_latitude?.toString() ?? "",
    lng: stop?.geo_longitude?.toString() ?? "",
    status: stop?.status ?? "Not Visited",
    stars: scoreToStars(stop?.score ?? null),
    date: stop?.addition_date ?? todayISO(),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, ...(key === "lat" || key === "lng" ? { lat: undefined, lng: undefined } : {}) }));
  };

  const onLinkChange = (link: string) => {
    set("link", link);
    const coords = coordsFromMapLink(link);
    setLinkFound(Boolean(coords));
    if (coords && !values.lat && !values.lng) {
      setValues((v) => ({ ...v, link, lat: String(coords.lat), lng: String(coords.lng) }));
    }
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Name the place.";
    if (values.link.length > 256) next.link = "Links are limited to 256 characters.";
    if (values.link && !/^https?:\/\//i.test(values.link)) next.link = "Use a full link starting with http(s)://";
    const hasLat = values.lat.trim() !== "";
    const hasLng = values.lng.trim() !== "";
    if (hasLat !== hasLng) {
      next[hasLat ? "lng" : "lat"] = "Latitude and longitude go together.";
    }
    if (hasLat && (Number.isNaN(Number(values.lat)) || Math.abs(Number(values.lat)) > 90)) next.lat = "Between -90 and 90.";
    if (hasLng && (Number.isNaN(Number(values.lng)) || Math.abs(Number(values.lng)) > 180)) next.lng = "Between -180 and 180.";
    if (!values.date) next.date = "Pick a date.";
    return next;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: GeoPointInput = {
      name: values.name.trim(),
      geo_link: values.link.trim() || null,
      geo_latitude: values.lat.trim() ? Number(values.lat) : null,
      geo_longitude: values.lng.trim() ? Number(values.lng) : null,
      status: values.status,
      score: starsToScore(values.stars),
      addition_date: values.date,
    };

    try {
      if (stop) {
        await update.mutateAsync({ id: stop.id, patch: payload });
        toast.success("Stop updated");
      } else {
        await create.mutateAsync({ ...payload, trip_id: tripId ?? null });
        toast.success(`Added ${payload.name}`);
      }
      onDone();
    } catch (error) {
      if (error instanceof ApiError) {
        const f = error.fields;
        setErrors({ name: f.name, link: f.geo_link, lat: f.geo_latitude, lng: f.geo_longitude, date: f.addition_date });
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
        hint={
          linkFound ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CircleCheck className="size-3.5" aria-hidden /> Coordinates picked up from the link
            </span>
          ) : (
            "Paste a Google Maps or OpenStreetMap link and we'll fill in the coordinates."
          )
        }
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
              onChange={(e) => onLinkChange(e.target.value)}
            />
          </div>
        )}
      </Field>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
          <LocateFixed className="size-3.5 text-fg-muted" aria-hidden />
          Coordinates <span className="font-normal text-fg-subtle">· optional, shows the stop on the map</span>
        </legend>
        <Field label="Latitude" error={errors.lat}>
          {(props) => (
            <Input
              {...props}
              inputMode="decimal"
              placeholder="38.7071"
              className="tabular"
              value={values.lat}
              onChange={(e) => set("lat", e.target.value)}
            />
          )}
        </Field>
        <Field label="Longitude" error={errors.lng}>
          {(props) => (
            <Input
              {...props}
              inputMode="decimal"
              placeholder="-9.1456"
              className="tabular"
              value={values.lng}
              onChange={(e) => set("lng", e.target.value)}
            />
          )}
        </Field>
      </fieldset>

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
