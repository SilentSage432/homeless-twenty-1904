"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminAlert,
  AdminField,
  AdminListItem,
  AdminSection,
  AdminTextArea,
  ImageDropZone,
} from "@/components/admin/AdminUi";
import { ImageCropEditor } from "@/components/admin/ImageCropEditor";
import { LocationAutocompleteField } from "@/components/admin/LocationAutocompleteField";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from "@/lib/supabase/content";
import { uploadEventAsset } from "@/lib/supabase/storage";
import {
  canManageSensitiveContent,
  type EventRow,
  type ProfileRole,
} from "@/lib/supabase/database.types";

const EMPTY_EVENT = {
  title: "",
  description: "",
  date: "",
  label: "",
  payment_url: "",
  location: "",
  latitude: null as number | null,
  longitude: null as number | null,
  map_url: "",
};

function toLocalInputValue(iso: string): string {
  const local = new Date(iso);
  if (Number.isNaN(local.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}

export function ManageEventsForm({
  role,
}: {
  role: ProfileRole | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const canSensitive = canManageSensitiveContent(role);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optional image-editing workflow (mirrors the Plaque Uploader).
  const [file, setFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  useEffect(() => {
    if (!rawImageSrc) return;
    return () => URL.revokeObjectURL(rawImageSrc);
  }, [rawImageSrc]);

  useEffect(() => {
    if (!croppedPreviewUrl) return;
    return () => URL.revokeObjectURL(croppedPreviewUrl);
  }, [croppedPreviewUrl]);

  function clearImageState() {
    setFile(null);
    setEditorOpen(false);
    setRawImageSrc(null);
    setCroppedPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    setForm(EMPTY_EVENT);
    setEditingId(null);
    setExistingImageUrl(null);
    clearImageState();
  }

  function handlePick(picked: File) {
    setError(null);
    setRawImageSrc(URL.createObjectURL(picked));
    setEditorOpen(true);
  }

  function handleEditorConfirm(cropped: File) {
    setFile(cropped);
    setCroppedPreviewUrl(URL.createObjectURL(cropped));
    setEditorOpen(false);
  }

  function handleEditorCancel() {
    setEditorOpen(false);
  }

  function clearEventImage() {
    setExistingImageUrl(null);
    clearImageState();
  }

  async function refreshRoster() {
    await queryClient.invalidateQueries({ queryKey: ["events"] });
    router.refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setBusy(true);

    let imageUrl = existingImageUrl;
    if (file) {
      const upload = await uploadEventAsset(file);
      if (!upload.ok) {
        setBusy(false);
        setError(upload.message);
        return;
      }
      imageUrl = upload.publicUrl;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: new Date(form.date).toISOString(),
      label: form.label.trim(),
      payment_url: canSensitive ? form.payment_url.trim() || null : null,
      image_url: imageUrl || null,
      location: form.location.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
      map_url: form.map_url.trim() || null,
    };

    // Preserve existing payment_url when a non-sensitive role edits.
    if (!canSensitive && editingId) {
      const existing = eventsQuery.data?.data?.find((ev) => ev.id === editingId);
      payload.payment_url = existing?.payment_url ?? null;
    }

    const result = editingId
      ? await updateEvent(editingId, payload)
      : await createEvent(payload);

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    setNotice(
      editingId
        ? "Event updated. Public Events board will reflect the change."
        : "Event created. Public Events board will show it when upcoming."
    );
    await refreshRoster();
  }

  function startEdit(event: EventRow) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      date: toLocalInputValue(event.date),
      label: event.label,
      payment_url: canSensitive ? event.payment_url ?? "" : "",
      location: event.location ?? "",
      latitude: event.latitude,
      longitude: event.longitude,
      map_url: event.map_url ?? "",
    });
    setExistingImageUrl(event.image_url || null);
    clearImageState();
    setNotice(null);
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!canSensitive) return;
    if (!confirm("Delete this event permanently? This cannot be undone.")) {
      return;
    }
    setBusy(true);
    setError(null);
    const { error: deleteError } = await deleteEvent(id);
    setBusy(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    if (editingId === id) resetForm();
    setNotice("Event deleted.");
    await refreshRoster();
  }

  const events = eventsQuery.data?.data ?? [];

  return (
    <AdminSection
      eyebrow="Component A"
      title="Events Manager"
      description="Create gatherings with title, description, date/time, badge label, an optional image, and an optional payment URL. Submissions write to the live events table. Edit or delete any row from the roster below."
    >
      {(notice || error) && (
        <AdminAlert tone={error ? "error" : "success"}>
          {error ?? notice}
        </AdminAlert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminField
          label="Title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          required
        />
        <AdminTextArea
          label="Description"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          required
        />
        <AdminField
          label="Date / Time"
          type="datetime-local"
          value={form.date}
          onChange={(v) => setForm((f) => ({ ...f, date: v }))}
          required
        />
        <AdminField
          label="Badge Label"
          value={form.label}
          onChange={(v) => setForm((f) => ({ ...f, label: v }))}
          placeholder="Dinner, Dedication, Lore Night…"
        />
        <LocationAutocompleteField
          label="Location (optional)"
          value={form.location}
          latitude={form.latitude}
          longitude={form.longitude}
          disabled={busy}
          onChange={(v) => setForm((f) => ({ ...f, location: v }))}
          onSelect={(sel) =>
            setForm((f) => ({
              ...f,
              location: sel.location,
              latitude: sel.latitude,
              longitude: sel.longitude,
              map_url: sel.mapUrl ?? "",
            }))
          }
        />
        <div>
          <ImageDropZone
            label="Event image (optional)"
            file={file}
            existingUrl={existingImageUrl}
            previewUrl={croppedPreviewUrl}
            required={false}
            disabled={busy}
            onFileChange={setFile}
            onPick={handlePick}
            inputRef={fileInputRef}
          />
          <div className="mt-2 flex flex-wrap gap-4">
            {rawImageSrc && !editorOpen ? (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                disabled={busy}
                className="focus-ring tap-target px-1 text-xs tracking-wide text-crimson underline underline-offset-4 disabled:opacity-60"
              >
                Adjust crop &amp; rotation
              </button>
            ) : null}
            {file || existingImageUrl ? (
              <button
                type="button"
                onClick={clearEventImage}
                disabled={busy}
                className="focus-ring tap-target px-1 text-xs tracking-wide text-slate-weathered underline underline-offset-4 hover:text-charcoal disabled:opacity-60"
              >
                Remove image
              </button>
            ) : null}
          </div>
        </div>
        {canSensitive ? (
          <AdminField
            label="Payment URL"
            value={form.payment_url}
            onChange={(v) => setForm((f) => ({ ...f, payment_url: v }))}
            placeholder="https://buy.stripe.com/…"
            hint="Leave blank to show an inactive registration placeholder on the public site."
          />
        ) : null}

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
          >
            {busy ? "Saving…" : editingId ? "Update Event" : "Create Event"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="focus-ring border border-charcoal/20 bg-transparent px-4 py-2.5 text-sm museum-ease hover:border-charcoal/40"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3 border-t border-charcoal/10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.18em] uppercase text-charcoal">
            Live event roster
          </h3>
          <button
            type="button"
            onClick={() => void refreshRoster()}
            disabled={eventsQuery.isFetching}
            className="focus-ring tap-target px-1 text-xs tracking-wide text-crimson underline underline-offset-4 disabled:opacity-60"
          >
            {eventsQuery.isFetching ? "Refreshing…" : "Refresh list"}
          </button>
        </div>

        {eventsQuery.isError ? (
          <AdminAlert tone="error">Could not load events.</AdminAlert>
        ) : null}

        <ul className="space-y-3">
          {events.map((event) => (
            <AdminListItem
              key={event.id}
              title={event.title}
              thumbnailUrl={event.image_url || null}
              meta={`${new Date(event.date).toLocaleString()}${
                event.label ? ` · ${event.label}` : ""
              }${canSensitive && event.payment_url ? " · Payment live" : ""}`}
              onEdit={() => startEdit(event)}
              onDelete={canSensitive ? () => void handleDelete(event.id) : undefined}
              canDelete={canSensitive}
            />
          ))}
          {events.length === 0 && !eventsQuery.isLoading && (
            <li className="text-sm text-slate-weathered font-body py-2">
              No events yet — create the first gathering above.
            </li>
          )}
          {eventsQuery.isLoading && (
            <li className="text-sm text-slate-weathered font-body py-2">
              Loading live events…
            </li>
          )}
        </ul>
      </div>

      {editorOpen && rawImageSrc ? (
        <ImageCropEditor
          imageSrc={rawImageSrc}
          onCancel={handleEditorCancel}
          onConfirm={handleEditorConfirm}
          eyebrow="Component A · Image editor"
          title="Crop & rotate event image"
          hint="Frame the image to a 4:3 ratio. Adjustments are applied client-side before upload."
        />
      ) : null}
    </AdminSection>
  );
}
