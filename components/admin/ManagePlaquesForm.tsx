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
  createPlaque,
  deletePlaque,
  fetchPlaques,
  updatePlaque,
} from "@/lib/supabase/content";
import { uploadPlaqueAsset } from "@/lib/supabase/storage";
import {
  canManageSensitiveContent,
  type PlaqueRow,
  type ProfileRole,
} from "@/lib/supabase/database.types";

const EMPTY_PLAQUE = {
  title: "",
  location: "",
  description: "",
  latitude: null as number | null,
  longitude: null as number | null,
  map_url: "",
};

export function ManagePlaquesForm({
  role,
}: {
  role: ProfileRole | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const canSensitive = canManageSensitiveContent(role);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY_PLAQUE);
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Image-editing workflow: raw picked source feeds the crop modal; the
  // confirmed cropped File becomes `file` and drives the preview.
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);

  const plaquesQuery = useQuery({
    queryKey: ["plaques"],
    queryFn: fetchPlaques,
  });

  // Revoke each object URL when it is replaced or on unmount. Each URL has its
  // own effect so updating one preview never invalidates the other.
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
    setForm(EMPTY_PLAQUE);
    setEditingId(null);
    setExistingImageUrl(null);
    clearImageState();
  }

  // A file was picked/dropped — open the editor instead of committing it.
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

  async function refreshRoster() {
    await queryClient.invalidateQueries({ queryKey: ["plaques"] });
    router.refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setBusy(true);

    let imageUrl = existingImageUrl ?? "";

    if (file) {
      const upload = await uploadPlaqueAsset(file);
      if (!upload.ok) {
        setBusy(false);
        setError(upload.message);
        return;
      }
      imageUrl = upload.publicUrl;
    }

    if (!imageUrl) {
      setBusy(false);
      setError("Add a plaque photograph via the drop zone before saving.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      image_url: imageUrl,
      latitude: form.latitude,
      longitude: form.longitude,
      map_url: form.map_url.trim() || null,
    };

    const result = editingId
      ? await updatePlaque(editingId, payload)
      : await createPlaque(payload);

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    setNotice(
      editingId
        ? "Plaque updated. Gallery will refresh with the new image URL."
        : "Plaque created. Image stored in plaque-assets and linked on image_url."
    );
    await refreshRoster();
  }

  function startEdit(plaque: PlaqueRow) {
    setEditingId(plaque.id);
    setForm({
      title: plaque.title,
      location: plaque.location,
      description: plaque.description,
      latitude: plaque.latitude,
      longitude: plaque.longitude,
      map_url: plaque.map_url ?? "",
    });
    setExistingImageUrl(plaque.image_url || null);
    clearImageState();
    setNotice(null);
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!canSensitive) return;
    if (!confirm("Delete this plaque permanently? This cannot be undone.")) {
      return;
    }
    setBusy(true);
    setError(null);
    const { error: deleteError } = await deletePlaque(id);
    setBusy(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    if (editingId === id) resetForm();
    setNotice("Plaque deleted.");
    await refreshRoster();
  }

  const plaques = plaquesQuery.data?.data ?? [];

  return (
    <AdminSection
      eyebrow="Component B"
      title="Plaque Uploader"
      description="Drag and drop physical plaque photography into the secure plaque-assets storage bucket. The resolved public URL is written to plaques.image_url. Edit or delete any row from the live roster below."
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
        <LocationAutocompleteField
          label="Location"
          value={form.location}
          latitude={form.latitude}
          longitude={form.longitude}
          required
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
            file={file}
            existingUrl={existingImageUrl}
            previewUrl={croppedPreviewUrl}
            required={!editingId || !existingImageUrl}
            disabled={busy}
            onFileChange={setFile}
            onPick={handlePick}
            inputRef={fileInputRef}
          />
          {rawImageSrc && !editorOpen ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              disabled={busy}
              className="focus-ring tap-target mt-2 px-1 text-xs tracking-wide text-crimson underline underline-offset-4 disabled:opacity-60"
            >
              Adjust crop &amp; rotation
            </button>
          ) : null}
        </div>
        <AdminTextArea
          label="Description"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          rows={3}
        />

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
          >
            {busy
              ? file
                ? "Uploading to plaque-assets…"
                : "Saving…"
              : editingId
                ? "Update Plaque"
                : "Publish Plaque"}
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
            Live plaque roster
          </h3>
          <button
            type="button"
            onClick={() => void refreshRoster()}
            disabled={plaquesQuery.isFetching}
            className="focus-ring tap-target px-1 text-xs tracking-wide text-crimson underline underline-offset-4 disabled:opacity-60"
          >
            {plaquesQuery.isFetching ? "Refreshing…" : "Refresh list"}
          </button>
        </div>

        {plaquesQuery.isError ? (
          <AdminAlert tone="error">Could not load plaques.</AdminAlert>
        ) : null}

        <ul className="space-y-3">
          {plaques.map((plaque) => (
            <AdminListItem
              key={plaque.id}
              title={plaque.title}
              meta={plaque.location}
              thumbnailUrl={plaque.image_url || null}
              onEdit={() => startEdit(plaque)}
              onDelete={canSensitive ? () => void handleDelete(plaque.id) : undefined}
              canDelete={canSensitive}
            />
          ))}
          {plaques.length === 0 && !plaquesQuery.isLoading && (
            <li className="text-sm text-slate-weathered font-body py-2">
              No plaques yet — drop a photograph to begin the gallery.
            </li>
          )}
          {plaquesQuery.isLoading && (
            <li className="text-sm text-slate-weathered font-body py-2">
              Loading live plaques…
            </li>
          )}
        </ul>
      </div>

      {editorOpen && rawImageSrc ? (
        <ImageCropEditor
          imageSrc={rawImageSrc}
          onCancel={handleEditorCancel}
          onConfirm={handleEditorConfirm}
          eyebrow="Component B · Image editor"
          title="Crop & rotate photograph"
          hint="Frame the plaque to a 4:3 ratio. Adjustments are applied client-side before upload to plaque-assets."
        />
      ) : null}
    </AdminSection>
  );
}
