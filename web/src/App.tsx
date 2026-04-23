import { type FormEvent, useState } from "react";
import {
  getGetItemsQueryKey,
  getGetReservationsQueryKey,
  useDeleteItemsId,
  useGetItems,
  useGetReservations,
  usePatchItemsId,
  usePatchReservationsId,
  usePostItems,
  usePostReservations,
  type PatchReservationStatus,
} from "./api";
import { useQueryClient } from "@tanstack/react-query";

interface ResourceForm {
  title: string;
  description: string;
  resourceType: string;
}

interface BookingForm {
  title: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  attendees: string;
  notes: string;
  startAt: string;
  endAt: string;
  agreedToTerms: boolean;
}

const emptyForm = (): ResourceForm => ({ title: "", description: "", resourceType: "" });
const emptyBookingForm = (): BookingForm => ({
  title: "", bookerName: "", bookerEmail: "", bookerPhone: "",
  attendees: "", notes: "", startAt: "", endAt: "", agreedToTerms: false,
});

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#fef9c3] text-[#854d0e]",
  confirmed: "bg-[#dcfce7] text-[#166534]",
  cancelled: "bg-[#f3f4f6] text-[#6b7280]",
  completed: "bg-[#dbeafe] text-[#1d4ed8]",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function App() {
  const [createForm, setCreateForm] = useState<ResourceForm>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ResourceForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [bookingResourceId, setBookingResourceId] = useState<number | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>(emptyBookingForm());
  const [bookingError, setBookingError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const searchParam = search.trim() || undefined;
  const refreshItems = () =>
    queryClient.invalidateQueries({ queryKey: getGetItemsQueryKey(searchParam ? { search: searchParam } : undefined) });
  const refreshReservations = (itemId: number) =>
    queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey({ itemId }) });

  const itemsQuery = useGetItems(searchParam ? { search: searchParam } : undefined);

  const reservationsQuery = useGetReservations(
    bookingResourceId !== null ? { itemId: bookingResourceId } : undefined,
    { query: { enabled: bookingResourceId !== null } }
  );

  const createMutation = usePostItems({
    mutation: {
      onSuccess: async () => {
        setCreateForm(emptyForm());
        await refreshItems();
      },
    },
  });

  const deleteMutation = useDeleteItemsId({
    mutation: { onSuccess: refreshItems },
  });

  const updateMutation = usePatchItemsId({
    mutation: {
      onSuccess: async () => {
        setEditingId(null);
        await refreshItems();
      },
    },
  });

  const bookMutation = usePostReservations({
    mutation: {
      onSuccess: async () => {
        setBookingForm(emptyBookingForm());
        setBookingError(null);
        if (bookingResourceId !== null) await refreshReservations(bookingResourceId);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setBookingError(msg ?? "Could not create reservation.");
      },
    },
  });

  const patchReservationMutation = usePatchReservationsId({
    mutation: {
      onSuccess: async () => {
        if (bookingResourceId !== null) await refreshReservations(bookingResourceId);
      },
    },
  });

  const resources = itemsQuery.data?.items ?? [];
  const deletingId = deleteMutation.variables?.id;
  const reservations = (reservationsQuery.data?.reservations ?? []).filter(
    (r) => new Date(r.endAt) > new Date()
  );

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = createForm.title.trim();
    if (!title || createMutation.isPending) return;
    createMutation.mutate({
      data: {
        title,
        description: createForm.description.trim() || null,
        resourceType: createForm.resourceType.trim() || null,
      },
    });
  };

  const startEdit = (resource: { id: number; title: string; description: string | null; resourceType: string | null }) => {
    setEditingId(resource.id);
    setEditForm({
      title: resource.title,
      description: resource.description ?? "",
      resourceType: resource.resourceType ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm());
  };

  const handleSave = (id: number) => {
    const title = editForm.title.trim();
    if (!title || updateMutation.isPending) return;
    updateMutation.mutate({
      id,
      data: {
        title,
        description: editForm.description.trim() || null,
        resourceType: editForm.resourceType.trim() || null,
      },
    });
  };

  const openBooking = (id: number) => {
    setBookingResourceId(id);
    setBookingForm(emptyBookingForm());
    setBookingError(null);
  };

  const closeBooking = () => {
    setBookingResourceId(null);
    setBookingForm(emptyBookingForm());
    setBookingError(null);
  };

  const handleBook = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingResourceId || bookMutation.isPending) return;
    const { title, bookerName, bookerEmail, bookerPhone, attendees, notes, startAt, endAt, agreedToTerms } = bookingForm;
    if (!title.trim() || !bookerName.trim() || !startAt || !endAt || !agreedToTerms) return;
    bookMutation.mutate({
      data: {
        itemId: bookingResourceId,
        title: title.trim(),
        bookerName: bookerName.trim(),
        bookerEmail: bookerEmail.trim() || null,
        bookerPhone: bookerPhone.trim() || null,
        attendees: attendees ? parseInt(attendees, 10) : null,
        notes: notes.trim() || null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      },
    });
  };

  const bookingResource = resources.find((r) => r.id === bookingResourceId);

  return (
    <main className="min-h-screen px-4 py-10 text-[#18293d]">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-white drop-shadow">Resources</h1>
          <p className="text-sm text-white/80">
            Add, edit, and remove bookable resources.
          </p>
        </header>

        {/* Create form */}
        <form
          className="flex flex-col gap-3 rounded-lg border border-white/30 bg-white/20 backdrop-blur-md p-4 shadow-lg"
          onSubmit={handleCreate}
        >
          <input
            value={createForm.title}
            onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Resource name"
            maxLength={120}
            className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
          />
          <input
            value={createForm.resourceType}
            onChange={(e) => setCreateForm((f) => ({ ...f, resourceType: e.target.value }))}
            placeholder="Type / category (e.g. Room, Vehicle)"
            maxLength={60}
            className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
          />
          <textarea
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            maxLength={500}
            rows={2}
            className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e] resize-none"
          />
          <button
            type="submit"
            disabled={!createForm.title.trim() || createMutation.isPending}
            className="rounded-md bg-[#1b3d5e] px-4 py-2 text-sm font-medium text-white hover:bg-[#153050] disabled:cursor-not-allowed disabled:bg-[#9aabb8]"
          >
            {createMutation.isPending ? "Adding..." : "Add resource"}
          </button>
        </form>

        {createMutation.isError && (
          <p className="text-sm text-[#b91c1c]">
            Could not add the resource: {createMutation.error.message}
          </p>
        )}
        {deleteMutation.isError && (
          <p className="text-sm text-[#b91c1c]">
            Could not remove the resource: {(deleteMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? deleteMutation.error.message}
          </p>
        )}
        {updateMutation.isError && (
          <p className="text-sm text-[#b91c1c]">
            Could not update the resource: {updateMutation.error.message}
          </p>
        )}

        {/* Resource list */}
        <section className="rounded-lg border border-white/30 bg-white/20 backdrop-blur-md p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[#18293d]">Resources</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources…"
              className="rounded-md border border-[#cdd7e0] px-3 py-1.5 text-sm outline-none focus:border-[#1b3d5e] w-48"
            />
          </div>

          {itemsQuery.isPending && (
            <p className="mt-3 text-sm text-[#4c637a]">Loading resources...</p>
          )}
          {itemsQuery.isError && (
            <p className="mt-3 text-sm text-[#b91c1c]">
              Could not load resources: {itemsQuery.error.message}
            </p>
          )}

          {!itemsQuery.isPending && !itemsQuery.isError && (
            resources.length > 0 ? (
              <ul className="mt-3 divide-y divide-[#cdd7e0]">
                {resources.map((resource) =>
                  editingId === resource.id ? (
                    <li key={resource.id} className="flex flex-col gap-2 py-3">
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Resource name"
                        maxLength={120}
                        className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
                      />
                      <input
                        value={editForm.resourceType}
                        onChange={(e) => setEditForm((f) => ({ ...f, resourceType: e.target.value }))}
                        placeholder="Type / category"
                        maxLength={60}
                        className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Description"
                        maxLength={500}
                        rows={2}
                        className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e] resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSave(resource.id)}
                          disabled={!editForm.title.trim() || updateMutation.isPending}
                          className="rounded-md bg-[#0f766e] px-3 py-1 text-sm font-medium text-white hover:bg-[#0d6b64] disabled:cursor-not-allowed disabled:bg-[#9aabb8]"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={updateMutation.isPending}
                          className="rounded-md border border-[#cdd7e0] px-3 py-1 text-sm text-[#18293d] hover:bg-[#f4f7fa] disabled:cursor-not-allowed disabled:text-[#9aabb8]"
                        >
                          Cancel
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={resource.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-[#18293d] truncate">{resource.title}</p>
                        {resource.resourceType && (
                          <span className="inline-block bg-[#dbeafe] text-[#1d4ed8] text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded">
                            {resource.resourceType}
                          </span>
                        )}
                        {resource.description && (
                          <p className="text-sm text-[#4c637a]">{resource.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openBooking(resource.id)}
                          className="rounded-md border border-[#0f766e] px-3 py-1 text-sm text-[#0f766e] hover:bg-[#f0fdf4]"
                        >
                          Book
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(resource)}
                          disabled={deleteMutation.isPending && deletingId === resource.id}
                          className="rounded-md border border-[#0369a1] px-3 py-1 text-sm text-[#0369a1] hover:bg-[#f0f9ff] disabled:cursor-not-allowed disabled:border-[#cdd7e0] disabled:text-[#9aabb8]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate({ id: resource.id })}
                          disabled={deleteMutation.isPending}
                          className="rounded-md border border-[#cdd7e0] px-3 py-1 text-sm text-[#18293d] hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:text-[#9aabb8]"
                        >
                          {deleteMutation.isPending && deletingId === resource.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#4c637a]">
                {search.trim() ? "No resources match your search." : "No resources yet."}
              </p>
            )
          )}
        </section>

        {/* Booking panel */}
        {bookingResourceId !== null && (
          <section className="rounded-lg border border-white/30 bg-white/20 backdrop-blur-md p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#18293d]">
                Book — <span className="font-normal">{bookingResource?.title}</span>
              </h2>
              <button
                type="button"
                onClick={closeBooking}
                className="text-xs text-[#4c637a] hover:text-[#18293d]"
              >
                Close ✕
              </button>
            </div>

            {/* Booking form */}
            <form className="flex flex-col gap-5" onSubmit={handleBook}>

              {/* Instructions */}
              <div className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-xs text-white/80 leading-relaxed">
                <strong className="block text-white mb-1">How to book</strong>
                Fill in the details below and submit your request as a <em>draft</em>. A coordinator will review and confirm your booking. You will receive a confirmation once approved.
              </div>

              {/* Section: Purpose */}
              <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Booking details</legend>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-white/80">Purpose / title <span className="text-red-300">*</span></label>
                  <input
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Weekly team meeting"
                    maxLength={120}
                    required
                    className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/70 focus:bg-white/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-white/80">Start date & time <span className="text-red-300">*</span></label>
                    <input
                      type="datetime-local"
                      value={bookingForm.startAt}
                      onChange={(e) => setBookingForm((f) => ({ ...f, startAt: e.target.value }))}
                      required
                      className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/70 focus:bg-white/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-white/80">End date & time <span className="text-red-300">*</span></label>
                    <input
                      type="datetime-local"
                      value={bookingForm.endAt}
                      onChange={(e) => setBookingForm((f) => ({ ...f, endAt: e.target.value }))}
                      required
                      className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/70 focus:bg-white/20"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-white/80">Number of attendees</label>
                  <input
                    type="number"
                    min={1}
                    value={bookingForm.attendees}
                    onChange={(e) => setBookingForm((f) => ({ ...f, attendees: e.target.value }))}
                    placeholder="e.g. 8"
                    className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/70 focus:bg-white/20"
                  />
                </div>
              </fieldset>

              {/* Section: Contact */}
              <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Contact information</legend>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-white/80">Full name <span className="text-red-300">*</span></label>
                  <input
                    value={bookingForm.bookerName}
                    onChange={(e) => setBookingForm((f) => ({ ...f, bookerName: e.target.value }))}
                    placeholder="First and last name"
                    maxLength={120}
                    required
                    className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/70 focus:bg-white/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-white/80">Email address</label>
                  <input
                    value={bookingForm.bookerEmail}
                    onChange={(e) => setBookingForm((f) => ({ ...f, bookerEmail: e.target.value }))}
                    placeholder="you@example.com"
                    type="email"
                    className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/70 focus:bg-white/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-white/80">Phone number</label>
                  <input
                    value={bookingForm.bookerPhone}
                    onChange={(e) => setBookingForm((f) => ({ ...f, bookerPhone: e.target.value }))}
                    placeholder="+47 000 00 000"
                    type="tel"
                    maxLength={30}
                    className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/70 focus:bg-white/20"
                  />
                </div>
              </fieldset>

              {/* Section: Notes */}
              <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Additional information</legend>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-white/80">Special requests / notes</label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Projector needed, wheelchair access required…"
                    maxLength={1000}
                    rows={3}
                    className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/70 focus:bg-white/20 resize-none"
                  />
                  <p className="text-xs text-white/50">{bookingForm.notes.length}/1000 characters</p>
                </div>
              </fieldset>

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingForm.agreedToTerms}
                  onChange={(e) => setBookingForm((f) => ({ ...f, agreedToTerms: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-white/40 accent-emerald-400"
                />
                <span className="text-xs text-white/70 leading-relaxed">
                  I confirm that the information provided is correct and I agree to the booking policy. Cancellations must be made at least 24 hours in advance.
                </span>
              </label>

              {bookingError && (
                <p className="rounded-md bg-red-500/20 border border-red-400/40 px-3 py-2 text-sm text-red-200">{bookingError}</p>
              )}

              <button
                type="submit"
                disabled={
                  !bookingForm.title.trim() ||
                  !bookingForm.bookerName.trim() ||
                  !bookingForm.startAt ||
                  !bookingForm.endAt ||
                  !bookingForm.agreedToTerms ||
                  bookMutation.isPending
                }
                className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {bookMutation.isPending ? "Submitting…" : "Submit booking request (draft)"}
              </button>
            </form>

            {/* Reservation list */}
            <div>
              <h3 className="text-xs font-medium text-[#4c637a] uppercase tracking-wide mb-2">
                Upcoming reservations
              </h3>
              {reservationsQuery.isPending && (
                <p className="text-sm text-[#4c637a]">Loading...</p>
              )}
              {!reservationsQuery.isPending && reservations.length === 0 && (
                <p className="text-sm text-[#4c637a]">No upcoming reservations.</p>
              )}
              {reservations.length > 0 && (
                <ul className="divide-y divide-[#cdd7e0]">
                  {reservations.map((r) => (
                    <li key={r.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[#18293d] truncate">{r.title}</p>
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[r.status] ?? ""}`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#4c637a]">
                        {formatDateTime(r.startAt)} → {formatDateTime(r.endAt)}
                      </p>
                      <p className="text-xs text-[#4c637a]">
                        {r.bookerName}{r.bookerEmail ? ` · ${r.bookerEmail}` : ""}{r.bookerPhone ? ` · ${r.bookerPhone}` : ""}
                      </p>
                      {r.attendees && (
                        <p className="text-xs text-[#4c637a]">{r.attendees} attendee{r.attendees !== 1 ? "s" : ""}</p>
                      )}
                      {r.notes && (
                        <p className="text-xs text-[#4c637a] italic">"{r.notes}"</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        {r.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => patchReservationMutation.mutate({ id: r.id, data: { status: "confirmed" as PatchReservationStatus } })}
                            disabled={patchReservationMutation.isPending}
                            className="rounded border border-[#0f766e] px-2 py-0.5 text-xs text-[#0f766e] hover:bg-[#f0fdf4] disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}
                        {(r.status === "draft" || r.status === "confirmed") && (
                          <button
                            type="button"
                            onClick={() => patchReservationMutation.mutate({ id: r.id, data: { status: "cancelled" as PatchReservationStatus } })}
                            disabled={patchReservationMutation.isPending}
                            className="rounded border border-[#cdd7e0] px-2 py-0.5 text-xs text-[#6b7280] hover:border-[#dc2626] hover:text-[#dc2626] disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        {r.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => patchReservationMutation.mutate({ id: r.id, data: { status: "completed" as PatchReservationStatus } })}
                            disabled={patchReservationMutation.isPending}
                            className="rounded border border-[#cdd7e0] px-2 py-0.5 text-xs text-[#6b7280] hover:bg-[#f4f7fa] disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}


