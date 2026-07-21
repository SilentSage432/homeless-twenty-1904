"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from "react";

export function AdminSection({
  eyebrow,
  title,
  description,
  children,
  deck = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Sharper control-deck chrome for developer cockpit modules. */
  deck?: boolean;
}) {
  return (
    <section
      className={
        deck
          ? "admin-panel admin-deck rounded-sm p-6 sm:p-7 space-y-6"
          : "admin-panel rounded-sm p-6 sm:p-7 space-y-6"
      }
    >
      <header>
        <p className="text-crimson text-[10px] sm:text-xs tracking-[0.24em] uppercase mb-2 font-mono">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl sm:text-[1.65rem] text-charcoal leading-tight">
          {title}
        </h2>
        <div className="mt-3 mb-3 h-px w-12 bg-gold" aria-hidden="true" />
        <p className="font-body text-sm leading-relaxed text-slate-weathered">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

export function AdminAlert({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "border border-crimson/25 bg-crimson/[0.06] px-4 py-3 text-sm text-crimson"
          : "border border-gold/35 bg-parchment-deep/80 px-4 py-3 text-sm text-charcoal"
      }
    >
      {children}
    </p>
  );
}

export function AdminToggle({
  label,
  checked,
  onChange,
  hint,
  disabled,
  showStatus = false,
  previewHref,
  previewLabel = "Preview page ↗",
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  disabled?: boolean;
  /** Shows a “Live on site” / “Disabled” badge beside the label. */
  showStatus?: boolean;
  /** Optional public route so stewards can verify the live page. */
  previewHref?: string;
  previewLabel?: string;
}) {
  const id = useId();
  return (
    <div
      className={`flex items-center justify-between gap-4 border border-charcoal/15 bg-white/70 px-4 py-3 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={id}
            className={`font-body text-sm text-charcoal ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {label}
          </label>
          {showStatus ? (
            <span
              className={
                checked
                  ? "inline-flex items-center border border-emerald-700/25 bg-emerald-700/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800"
                  : "inline-flex items-center border border-charcoal/15 bg-charcoal/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-weathered"
              }
            >
              {checked ? "Live on site" : "Disabled"}
            </span>
          ) : null}
        </div>
        {hint ? (
          <p className="mt-1.5 max-w-xl font-body text-xs leading-relaxed text-slate-weathered">
            {hint}
          </p>
        ) : null}
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-2 inline-flex text-xs text-crimson/80 underline underline-offset-4 decoration-crimson/30 museum-ease hover:text-crimson hover:decoration-crimson"
          >
            {previewLabel}
          </a>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`focus-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
          checked ? "bg-crimson" : "bg-charcoal/25"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-parchment shadow-sm transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function AdminField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
        {required ? <span className="text-crimson"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input focus-ring"
      />
      {hint ? (
        <p className="mt-1.5 text-xs text-slate-weathered/90">{hint}</p>
      ) : null}
    </div>
  );
}

export function AdminSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
        {required ? <span className="text-crimson"> *</span> : null}
      </label>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input focus-ring"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AdminTextArea({
  label,
  value,
  onChange,
  required,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
        {required ? <span className="text-crimson"> *</span> : null}
      </label>
      <textarea
        id={id}
        required={required}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input focus-ring resize-y min-h-[100px]"
      />
    </div>
  );
}

export function AdminListItem({
  title,
  meta,
  onEdit,
  onDelete,
  thumbnailUrl,
  canDelete = true,
}: {
  title: string;
  meta: string;
  onEdit: () => void;
  onDelete?: () => void;
  thumbnailUrl?: string | null;
  canDelete?: boolean;
}) {
  return (
    <li className="museum-card flex flex-col gap-3 border border-charcoal/10 bg-parchment/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {thumbnailUrl ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden border border-charcoal/15 bg-charcoal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="font-display text-lg text-charcoal truncate">{title}</p>
          <p className="text-xs text-slate-weathered mt-0.5">{meta}</p>
        </div>
      </div>
      <div className="flex gap-4 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="focus-ring tap-target px-1 text-sm text-crimson underline underline-offset-4 decoration-crimson/40 museum-ease hover:decoration-crimson"
        >
          Edit
        </button>
        {canDelete && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="focus-ring tap-target px-1 text-sm text-slate-weathered underline underline-offset-4 museum-ease hover:text-charcoal"
          >
            Delete
          </button>
        ) : null}
      </div>
    </li>
  );
}

type DropZoneProps = {
  file: File | null;
  existingUrl?: string | null;
  required?: boolean;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  /**
   * When provided, a freshly-picked/dropped file is handed to `onPick`
   * (e.g. to open a crop editor) instead of being committed directly.
   */
  onPick?: (file: File) => void;
  /** Externally-controlled preview (e.g. the cropped result). */
  previewUrl?: string | null;
  /** Field label shown above the drop zone. */
  label?: string;
};

export function ImageDropZone({
  file,
  existingUrl,
  required,
  disabled,
  onFileChange,
  inputRef,
  onPick,
  previewUrl,
  label = "Plaque photograph",
}: DropZoneProps) {
  const id = useId();
  const [active, setActive] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Keep internal preview in sync when parent resets `file` to null
  useEffect(() => {
    if (!file) {
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [file]);

  const assignFile = useCallback(
    (next: File | null) => {
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return next ? URL.createObjectURL(next) : null;
      });
      onFileChange(next);
    },
    [onFileChange]
  );

  const acceptFile = useCallback(
    (next: File | null) => {
      if (next && onPick) {
        onPick(next);
        return;
      }
      assignFile(next);
    },
    [assignFile, onPick]
  );

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) setActive(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    setActive(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setActive(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      acceptFile(dropped);
      if (!onPick && inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(dropped);
        inputRef.current.files = dt.files;
      }
    }
  }

  const preview =
    previewUrl || objectUrl || (!file ? existingUrl || null : null);

  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
        {required ? <span className="text-crimson"> *</span> : null}
      </label>

      <div
        role="button"
        tabIndex={0}
        data-active={active ? "true" : "false"}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        className="drop-zone focus-ring relative cursor-pointer rounded-sm px-4 py-8 text-center"
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
          required={onPick ? false : required}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
        />

        {preview ? (
          <div className="mx-auto mb-4 relative h-28 w-40 overflow-hidden border border-charcoal/15 bg-charcoal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Selected plaque preview"
              className="h-full w-full object-cover museum-media"
            />
          </div>
        ) : (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-gold/40 text-gold">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
        )}

        <p className="font-display text-base text-charcoal">
          {file
            ? file.name
            : active
              ? "Release to attach"
              : "Drag & drop a plaque photo"}
        </p>
        <p className="mt-1.5 text-xs text-slate-weathered">
          {file
            ? `${Math.round(file.size / 1024)} KB · ${
                onPick ? "cropped · click to choose another" : "click to replace"
              }`
            : previewUrl || (existingUrl && !file)
              ? "Current image kept · drop a new file to replace"
              : onPick
                ? "JPEG, PNG, or WebP · you'll crop & rotate before saving"
                : "JPEG, PNG, or WebP · up to 8MB · uploads to plaque-assets"}
        </p>
      </div>
    </div>
  );
}
