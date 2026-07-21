"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

const SUBJECTS = [
  "General Inquiry",
  "Plaque Nomination",
  "Event / RSVP",
  "Membership",
  "Media & Press",
  "Other",
] as const;

type Status = "idle" | "sending" | "success" | "error";

const FIELD_CLASS =
  "focus-ring w-full border border-charcoal/25 bg-parchment px-3.5 py-2.5 font-body text-charcoal placeholder:text-slate-weathered/60 min-h-[44px]";
const LABEL_CLASS =
  "block mb-1.5 text-xs tracking-[0.14em] uppercase text-slate-weathered";

function initialSubject(prefill?: string): string {
  if (prefill && (SUBJECTS as readonly string[]).includes(prefill)) return prefill;
  return SUBJECTS[0];
}

export function ContactModal({
  isOpen,
  onClose,
  prefillSubject,
}: {
  isOpen: boolean;
  onClose: () => void;
  prefillSubject?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(initialSubject(prefillSubject));
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Reset + focus each time the modal opens; lock background scroll.
  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setEmail("");
    setSubject(initialSubject(prefillSubject));
    setPhone("");
    setMessage("");
    setHoneypot("");
    setStatus("idle");
    setError(null);

    const raf = requestAnimationFrame(() => firstFieldRef.current?.focus());
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, prefillSubject]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, phone, message, honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/90"
        aria-hidden="true"
        onClick={status === "sending" ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto border border-gold/40 bg-parchment shadow-[var(--shadow-lift)]">
        <div className="flex items-start justify-between gap-4 border-b border-charcoal/10 bg-charcoal px-6 py-5">
          <div>
            <p className="text-gold text-[10px] sm:text-xs tracking-[0.24em] uppercase mb-1 font-mono">
              Contact the Lodge
            </p>
            <h2
              id="contact-modal-title"
              className="font-display text-2xl text-parchment leading-tight"
            >
              Send Us a Message
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact form"
            className="focus-ring -mr-1 flex h-10 w-10 shrink-0 items-center justify-center text-parchment/80 hover:text-gold"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold text-gold">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="font-display text-2xl text-charcoal mb-2">
              Message Delivered!
            </h3>
            <p className="font-body text-slate-weathered mb-6">
              Thank you for reaching out. Lodge leadership will reply to your
              email as soon as possible.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {error && (
              <p
                role="alert"
                className="border border-crimson/30 bg-crimson/[0.06] px-4 py-3 text-sm text-crimson"
              >
                {error}
              </p>
            )}

            {/* Honeypot — visually hidden, off-screen; bots fill it, humans don't. */}
            <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="contact-company">Company</label>
              <input
                id="contact-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className={LABEL_CLASS}>
                  Name <span className="text-crimson">*</span>
                </label>
                <input
                  id="contact-name"
                  ref={firstFieldRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={FIELD_CLASS}
                  disabled={status === "sending"}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={LABEL_CLASS}>
                  Email <span className="text-crimson">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={FIELD_CLASS}
                  disabled={status === "sending"}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-subject" className={LABEL_CLASS}>
                  Subject / Category
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={FIELD_CLASS}
                  disabled={status === "sending"}
                >
                  {prefillSubject &&
                  !(SUBJECTS as readonly string[]).includes(prefillSubject) ? (
                    <option value={prefillSubject}>{prefillSubject}</option>
                  ) : null}
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="contact-phone" className={LABEL_CLASS}>
                  Phone <span className="text-slate-weathered/70">(optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={FIELD_CLASS}
                  disabled={status === "sending"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className={LABEL_CLASS}>
                Message <span className="text-crimson">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${FIELD_CLASS} resize-y`}
                disabled={status === "sending"}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={status === "sending"}
                className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send Message"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={status === "sending"}
                className="focus-ring border border-charcoal/20 bg-transparent px-4 py-2.5 text-sm museum-ease hover:border-charcoal/40 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
