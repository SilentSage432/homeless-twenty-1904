"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminAlert,
  AdminField,
  AdminSection,
  AdminTextArea,
} from "@/components/admin/AdminUi";
import { getSessionUserId } from "@/lib/supabase/auth";
import { requestRevalidate } from "@/lib/supabase/staff-api";
import {
  createFaq,
  defaultSiteSettings,
  deleteFaq,
  fetchFaqs,
  fetchRevisions,
  fetchSections,
  fetchSiteSettings,
  updateFaq,
  updateSiteSettings,
  upsertSection,
} from "@/lib/supabase/cms";
import type {
  ContentRevision,
  FaqRow,
  HeroConfig,
  SiteContentSection,
} from "@/lib/supabase/database.types";
import { useModalA11y } from "@/lib/hooks/useModalA11y";

const SECTION_LABELS: Record<string, string> = {
  "about-lore": "About page · Lodge lore",
  "president-message": "About page · President's message",
};

function sectionLabel(slug: string): string {
  return SECTION_LABELS[slug] ?? slug;
}

export function ContentManager() {
  return (
    <div className="space-y-8">
      <HeroManager />
      <SectionEditor />
      <FaqManager />
    </div>
  );
}

// --- Hero ---------------------------------------------------------------------

function HeroManager() {
  const [hero, setHero] = useState<HeroConfig>(defaultSiteSettings().hero_config);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSiteSettings().then((s) => {
      if (cancelled) return;
      setHero(s.hero_config);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const userId = await getSessionUserId();
    const { error: e } = await updateSiteSettings({ hero_config: hero }, userId);
    setSaving(false);
    if (e) return setError(e);
    await requestRevalidate(["/"]);
    setMessage("Hero updated and published to the homepage.");
  }

  return (
    <AdminSection
      eyebrow="Homepage · Hero"
      title="Hero Manager"
      description="Headline, subtitle, and call-to-action shown at the top of the homepage."
      deck
    >
      {loading ? (
        <p className="font-body text-sm text-slate-weathered">Loading…</p>
      ) : (
        <div className="space-y-4">
          {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
          {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}
          <AdminTextArea
            label="Headline"
            rows={2}
            value={hero.title}
            onChange={(v) => setHero((h) => ({ ...h, title: v }))}
            hint="Large text at the top of the homepage."
          />
          <AdminTextArea
            label="Subtitle"
            rows={2}
            value={hero.subtitle}
            onChange={(v) => setHero((h) => ({ ...h, subtitle: v }))}
            hint="Supporting sentence under the headline."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Button text"
              value={hero.button_text}
              onChange={(v) => setHero((h) => ({ ...h, button_text: v }))}
              hint="Label on the homepage button."
            />
            <AdminField
              label="Button link"
              value={hero.button_link}
              onChange={(v) => setHero((h) => ({ ...h, button_link: v }))}
              placeholder="/#events"
              hint="Where the button goes (e.g. /events)."
            />
          </div>
          <AdminField
            label="Background image URL (optional)"
            value={hero.bg_image_url}
            onChange={(v) => setHero((h) => ({ ...h, bg_image_url: v }))}
            hint="Leave blank to keep the default dark frontier backdrop."
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save hero"}
          </button>
        </div>
      )}
    </AdminSection>
  );
}

// --- Sections -----------------------------------------------------------------

function SectionEditor() {
  const [sections, setSections] = useState<SiteContentSection[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { title: string; content: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [historySlug, setHistorySlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchSections();
    setSections(data);
    setDrafts(
      Object.fromEntries(
        data.map((s) => [s.slug, { title: s.title, content: s.content }])
      )
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(slug: string) {
    setSavingSlug(slug);
    setError(null);
    setMessage(null);
    const userId = await getSessionUserId();
    const draft = drafts[slug] ?? { title: "", content: "" };
    const { error: e } = await upsertSection(slug, draft, userId);
    setSavingSlug(null);
    if (e) return setError(e);
    await requestRevalidate(["/", "/about"]);
    setMessage(`Saved “${sectionLabel(slug)}” and published.`);
  }

  async function restore(slug: string, content: string, createdAt: string) {
    const when = new Date(createdAt).toLocaleString();
    if (
      !confirm(
        `Replace the current text for “${sectionLabel(slug)}” with the version from ${when}?\n\nUnsaved edits in the form will also be replaced.`
      )
    ) {
      return;
    }
    setHistorySlug(null);
    setSavingSlug(slug);
    setError(null);
    setMessage(null);
    const userId = await getSessionUserId();
    const title = drafts[slug]?.title ?? "";
    const { error: e } = await upsertSection(slug, { title, content }, userId);
    setSavingSlug(null);
    if (e) return setError(e);
    setDrafts((d) => ({ ...d, [slug]: { title, content } }));
    await load();
    await requestRevalidate(["/", "/about"]);
    setMessage(`Restored the ${when} version of “${sectionLabel(slug)}” and published it.`);
  }

  return (
    <AdminSection
      eyebrow="Pages · Static Content"
      title="Section Editor"
      description="Edit reusable page blocks. Content accepts basic HTML (paragraphs, links, lists). Every save is snapshotted to revision history."
      deck
    >
      {loading ? (
        <p className="font-body text-sm text-slate-weathered">Loading…</p>
      ) : sections.length === 0 ? (
        <p className="font-body text-sm text-slate-weathered">
          No page sections are set up yet. Ask a developer to finish site setup,
          then refresh.
        </p>
      ) : (
        <div className="space-y-6">
          {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
          {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}
          {sections.map((section) => (
            <div
              key={section.slug}
              className="border border-charcoal/12 bg-white/70 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-body text-sm font-medium text-charcoal">
                  {sectionLabel(section.slug)}
                </p>
                <button
                  type="button"
                  onClick={() => setHistorySlug(section.slug)}
                  className="focus-ring tap-target px-1 text-xs tracking-wide text-crimson underline underline-offset-4"
                >
                  Revision history
                </button>
              </div>
              <AdminField
                label="Title"
                value={drafts[section.slug]?.title ?? ""}
                onChange={(v) =>
                  setDrafts((d) => ({
                    ...d,
                    [section.slug]: { ...d[section.slug], title: v },
                  }))
                }
              />
              <AdminTextArea
                label="Content (HTML)"
                rows={6}
                value={drafts[section.slug]?.content ?? ""}
                onChange={(v) =>
                  setDrafts((d) => ({
                    ...d,
                    [section.slug]: { ...d[section.slug], content: v },
                  }))
                }
                hint="You can use simple formatting: paragraphs, links, and lists. Avoid pasting from Word if the layout looks broken."
              />
              <button
                type="button"
                onClick={() => void save(section.slug)}
                disabled={savingSlug === section.slug}
                className="focus-ring btn-primary px-5 py-2 text-sm tracking-wide disabled:opacity-60"
              >
                {savingSlug === section.slug ? "Saving…" : "Save section"}
              </button>
            </div>
          ))}
        </div>
      )}

      {historySlug ? (
        <RevisionHistoryModal
          slug={historySlug}
          onClose={() => setHistorySlug(null)}
          onRestore={(content, createdAt) =>
            void restore(historySlug, content, createdAt)
          }
        />
      ) : null}
    </AdminSection>
  );
}

function RevisionHistoryModal({
  slug,
  onClose,
  onRestore,
}: {
  slug: string;
  onClose: () => void;
  onRestore: (content: string, createdAt: string) => void;
}) {
  const [revisions, setRevisions] = useState<ContentRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModalA11y({ open: true, onClose, initialFocusRef: closeRef });

  useEffect(() => {
    let cancelled = false;
    void fetchRevisions(slug).then((data) => {
      if (cancelled) return;
      setRevisions(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Revision history for ${sectionLabel(slug)}`}
    >
      <div className="absolute inset-0 bg-charcoal/90" aria-hidden="true" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col border border-gold/40 bg-parchment shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between gap-3 border-b border-charcoal/10 bg-charcoal px-5 py-4">
          <div>
            <p className="font-mono text-gold text-[10px] tracking-[0.24em] uppercase">
              Revision history
            </p>
            <p className="font-body text-sm text-parchment/85">
              {sectionLabel(slug)}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close revision history"
            className="focus-ring flex h-11 w-11 items-center justify-center text-parchment/80 hover:text-gold"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="font-body text-sm text-slate-weathered">Loading…</p>
          ) : revisions.length === 0 ? (
            <p className="font-body text-sm text-slate-weathered">
              No prior versions yet. Snapshots are captured each time you save.
            </p>
          ) : (
            <ul className="space-y-3">
              {revisions.map((rev) => (
                <li key={rev.id} className="border border-charcoal/12 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] text-slate-weathered">
                      {new Date(rev.created_at).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRestore(rev.content, rev.created_at)}
                      className="focus-ring tap-target px-1 text-sm text-crimson underline underline-offset-4"
                    >
                      Restore
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-3 font-mono text-xs text-charcoal/80">
                    {rev.content.replace(/<[^>]+>/g, " ").slice(0, 240) || "(empty)"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// --- FAQs ---------------------------------------------------------------------

function FaqManager() {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchFaqs(false);
    setFaqs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!newQ.trim()) return;
    setAdding(true);
    setError(null);
    setMessage(null);
    const nextOrder =
      faqs.length > 0 ? Math.max(...faqs.map((f) => f.display_order)) + 1 : 0;
    const { error: e } = await createFaq({
      question: newQ.trim(),
      answer: newA.trim(),
      display_order: nextOrder,
      is_published: true,
    });
    setAdding(false);
    if (e) return setError(e);
    setNewQ("");
    setNewA("");
    setMessage("FAQ added and is live on the About page.");
    await load();
    await requestRevalidate(["/about"]);
  }

  async function patch(id: string, payload: Partial<FaqRow>, success?: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    const { error: e } = await updateFaq(id, payload);
    setBusyId(null);
    if (e) return setError(e);
    if (success) setMessage(success);
    await load();
    await requestRevalidate(["/about"]);
  }

  async function remove(faq: FaqRow) {
    if (
      !confirm(
        `Delete this FAQ?\n\n“${faq.question}”\n\nIt will disappear from the About page. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(faq.id);
    setError(null);
    setMessage(null);
    const { error: e } = await deleteFaq(faq.id);
    setBusyId(null);
    if (e) return setError(e);
    setMessage("FAQ deleted.");
    await load();
    await requestRevalidate(["/about"]);
  }

  async function move(index: number, dir: -1 | 1) {
    const target = faqs[index];
    const swap = faqs[index + dir];
    if (!target || !swap) return;
    setBusyId(target.id);
    setError(null);
    setMessage(null);
    const a = await updateFaq(target.id, { display_order: swap.display_order });
    const b = await updateFaq(swap.id, { display_order: target.display_order });
    setBusyId(null);
    if (a.error || b.error) {
      setError(a.error ?? b.error ?? "Couldn't reorder FAQs.");
      return;
    }
    setMessage("FAQ order updated on the About page.");
    await load();
    await requestRevalidate(["/about"]);
  }

  return (
    <AdminSection
      eyebrow="Public · FAQ"
      title="FAQ Manager"
      description="Add, edit, reorder, publish, and remove frequently asked questions shown on the About page."
      deck
    >
      <div className="space-y-5">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

        <div className="border border-gold/40 bg-parchment-deep/60 p-4 space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal">
            Add a FAQ
          </p>
          <AdminField
            label="Question"
            value={newQ}
            onChange={setNewQ}
            hint="The question visitors see on the About page."
          />
          <AdminTextArea
            label="Answer"
            rows={3}
            value={newA}
            onChange={setNewA}
            hint="Keep answers clear and concise."
          />
          <button
            type="button"
            onClick={() => void add()}
            disabled={adding || !newQ.trim()}
            className="focus-ring btn-primary px-5 py-2 text-sm tracking-wide disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add FAQ"}
          </button>
        </div>

        {loading ? (
          <p className="font-body text-sm text-slate-weathered">Loading…</p>
        ) : faqs.length === 0 ? (
          <p className="font-body text-sm text-slate-weathered">No FAQs yet.</p>
        ) : (
          <ul className="space-y-3">
            {faqs.map((faq, i) => (
              <li
                key={faq.id}
                className="border border-charcoal/12 bg-white/70 p-4 space-y-3"
              >
                <AdminField
                  label={`Question #${i + 1}`}
                  value={faq.question}
                  onChange={(v) =>
                    setFaqs((prev) =>
                      prev.map((f) => (f.id === faq.id ? { ...f, question: v } : f))
                    )
                  }
                />
                <AdminTextArea
                  label="Answer"
                  rows={3}
                  value={faq.answer}
                  onChange={(v) =>
                    setFaqs((prev) =>
                      prev.map((f) => (f.id === faq.id ? { ...f, answer: v } : f))
                    )
                  }
                />
                <p className="text-xs text-slate-weathered">
                  Save stores text changes. Publish/Unpublish controls whether
                  visitors see this FAQ. ↑↓ changes the order on the About page.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void patch(
                        faq.id,
                        {
                          question: faq.question,
                          answer: faq.answer,
                        },
                        "FAQ saved."
                      )
                    }
                    disabled={busyId === faq.id}
                    className="focus-ring btn-primary px-4 py-2 text-sm tracking-wide disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void patch(
                        faq.id,
                        { is_published: !faq.is_published },
                        faq.is_published
                          ? "FAQ hidden from visitors."
                          : "FAQ published on the About page."
                      )
                    }
                    disabled={busyId === faq.id}
                    className="focus-ring tap-target px-1 text-sm text-charcoal underline underline-offset-4 disabled:opacity-60"
                  >
                    {faq.is_published
                      ? "Unpublish (hide from visitors)"
                      : "Publish (show on About page)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(i, -1)}
                    disabled={busyId === faq.id || i === 0}
                    className="focus-ring tap-target px-1 text-sm text-slate-weathered underline underline-offset-4 disabled:opacity-30"
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(i, 1)}
                    disabled={busyId === faq.id || i === faqs.length - 1}
                    className="focus-ring tap-target px-1 text-sm text-slate-weathered underline underline-offset-4 disabled:opacity-30"
                  >
                    ↓ Down
                  </button>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wide ${
                      faq.is_published ? "text-emerald-700" : "text-slate-weathered"
                    }`}
                  >
                    {faq.is_published ? "published" : "hidden"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(faq)}
                    disabled={busyId === faq.id}
                    className="focus-ring tap-target ml-auto px-1 text-sm text-crimson underline underline-offset-4 disabled:opacity-60"
                  >
                    Delete
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
