import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useCreateTrip, useUpdateTrip } from "../../api/trips";
import { ApiError, errorMessage } from "../../lib/api";
import { todayISO } from "../../lib/format";
import { TRIP_STATUSES, type Trip, type TripInput, type TripStatus } from "../../lib/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, Input } from "../ui/Field";
import { Segmented } from "../ui/Segmented";
import { statusLabel } from "../ui/StatusBadge";

interface TripFormDialogProps {
  open: boolean;
  onClose: () => void;
  trip?: Trip;
}

export function TripFormDialog({ open, onClose, trip }: TripFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={trip ? "Edit trip" : "Plan a new trip"}
      description={trip ? "Update the name, date or status." : "Give it a name and a start date. You'll add stops next."}
    >
      <TripForm trip={trip} onDone={onClose} />
    </Dialog>
  );
}

function TripForm({ trip, onDone }: { trip?: Trip; onDone: () => void }) {
  const navigate = useNavigate();
  const create = useCreateTrip();
  const update = useUpdateTrip(trip?.id ?? NaN);
  const mutation = trip ? update : create;

  const [values, setValues] = useState<TripInput>({
    title: trip?.title ?? "",
    date: trip?.date ?? todayISO(),
    status: trip?.status ?? "Planned",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TripInput, string>>>({});

  const set = <K extends keyof TripInput>(key: K, value: TripInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const title = values.title.trim();
    const nextErrors: typeof errors = {};
    if (!title) nextErrors.title = "Give your trip a name.";
    if (title.length > 256) nextErrors.title = "Keep it under 256 characters.";
    if (!values.date) nextErrors.date = "Pick a date.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (trip) {
        await update.mutateAsync({ ...values, title });
        toast.success("Trip updated");
        onDone();
      } else {
        const created = await create.mutateAsync({ ...values, title });
        toast.success(`“${created.title}” is on the map`);
        onDone();
        navigate(`/trips/${created.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ title: "You already have a trip with this name on that date." });
        return;
      }
      if (error instanceof ApiError && Object.keys(error.fields).length) {
        setErrors({ title: error.fields.title, date: error.fields.date });
      }
      toast.error(errorMessage(error));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Trip name" error={errors.title}>
        {(props) => (
          <Input
            {...props}
            autoFocus
            maxLength={256}
            placeholder="Lisbon long weekend"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
          />
        )}
      </Field>

      <Field label="Start date" error={errors.date}>
        {(props) => <Input {...props} type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />}
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold">Status</span>
        <Segmented<TripStatus>
          label="Trip status"
          value={values.status}
          onChange={(status) => set("status", status)}
          options={TRIP_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
          className="w-full"
        />
      </div>

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {trip ? "Save changes" : "Create trip"}
        </Button>
      </div>
    </form>
  );
}
