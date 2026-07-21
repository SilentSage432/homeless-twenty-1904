"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminAlert,
  AdminField,
  AdminSection,
} from "@/components/admin/AdminUi";
import {
  createDocument,
  deleteDocument,
  fetchDocuments,
  uploadDocumentFile,
} from "@/lib/supabase/cms";
import type { PublicDocument } from "@/lib/supabase/database.types";

export function DocumentManager() {
  const [docs, setDocs] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchDocuments();
    setDocs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const { url, error: e } = await uploadDocumentFile(file);
    setUploading(false);
    if (e || !url) {
      setError(e ?? "Upload failed.");
      return;
    }
    setFileUrl(url);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    setMessage("File uploaded — add a title and save the entry.");
  }

  async function save() {
    if (!title.trim() || !fileUrl.trim()) {
      setError("A title and file (upload or URL) are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error: e } = await createDocument({
      title: title.trim(),
      category: category.trim(),
      file_url: fileUrl.trim(),
    });
    setSaving(false);
    if (e) return setError(e);
    setTitle("");
    setCategory("");
    setFileUrl("");
    if (fileRef.current) fileRef.current.value = "";
    setMessage("Document published.");
    await load();
  }

  async function remove(doc: PublicDocument) {
    if (!confirm(`Remove “${doc.title}” from public documents?`)) return;
    setBusyId(doc.id);
    setError(null);
    const { error: e } = await deleteDocument(doc.id);
    setBusyId(null);
    if (e) return setError(e);
    await load();
  }

  return (
    <AdminSection
      eyebrow="Public · Documents"
      title="Public Documents"
      description="Upload PDFs and files (bylaws, newsletters, forms) for public download. Files land in the lodge-documents bucket."
      deck
    >
      <div className="space-y-6">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

        <div className="border border-gold/40 bg-parchment-deep/60 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Title" value={title} onChange={setTitle} required />
            <AdminField
              label="Category"
              value={category}
              onChange={setCategory}
              placeholder="Bylaws, Newsletter, Form…"
            />
          </div>

          <div>
            <label className="admin-label" htmlFor="doc-file">
              Upload file
            </label>
            <input
              id="doc-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
              className="admin-input focus-ring"
            />
            {uploading ? (
              <p className="mt-1.5 text-xs text-slate-weathered">Uploading…</p>
            ) : null}
          </div>

          <AdminField
            label="File URL"
            value={fileUrl}
            onChange={setFileUrl}
            hint="Auto-filled after upload, or paste an external link."
          />

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || uploading}
            className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
          >
            {saving ? "Saving…" : "Publish document"}
          </button>
        </div>

        {loading ? (
          <p className="font-body text-sm text-slate-weathered">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="font-body text-sm text-slate-weathered">
            No documents published yet.
          </p>
        ) : (
          <ul className="divide-y divide-charcoal/10 border border-charcoal/15 bg-white/80">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-display text-base text-charcoal truncate">
                    {doc.title}
                  </p>
                  <p className="font-mono text-[11px] text-slate-weathered">
                    {doc.category || "Uncategorized"} ·{" "}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring text-sm text-crimson underline underline-offset-4"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => void remove(doc)}
                    disabled={busyId === doc.id}
                    className="focus-ring text-sm text-slate-weathered underline underline-offset-4 hover:text-charcoal disabled:opacity-60"
                  >
                    {busyId === doc.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminSection>
  );
}
