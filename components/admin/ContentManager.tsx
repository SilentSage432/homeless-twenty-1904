"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminAlert,
  AdminField,
  AdminSection,
  AdminTextArea,
} from "@/components/admin/AdminUi";
import { getSessionUserId } from "@/lib/supabase/auth";
import {
  createFaq,
  defaultSiteSettings,
  deleteFaq,
  fetchFaqs,
  fetchSections,
  fetchSiteSettings,
  updateFaq,
  updateSiteSettings,
  upsertSection,
} from "@/lib/supabase/cms";
import type {
  FaqRow,
  HeroConfig,
  SiteContentSection,
} from "@/lib/supabase/database.types";

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
    setMessage("Hero updated.");
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
          />
          <AdminTextArea
            label="Subtitle"
            rows={2}
            value={hero.subtitle}
            onChange={(v) => setHero((h) => ({ ...h, subtitle: v }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Button text"
              value={hero.button_text}
              onChange={(v) => setHero((h) => ({ ...h, button_text: v }))}
            />
            <AdminField
              label="Button link"
              value={hero.button_link}
              onChange={(v) => setHero((h) => ({ ...h, button_link: v }))}
              placeholder="/#events"
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
    setMessage(`Saved “${slug}”.`);
  }

  return (
    <AdminSection
      eyebrow="Pages · Static Content"
      title="Section Editor"
      description="Edit reusable page blocks. Content accepts basic HTML (paragraphs, links, lists)."
      deck
    >
      {loading ? (
        <p className="font-body text-sm text-slate-weathered">Loading…</p>
      ) : sections.length === 0 ? (
        <p className="font-body text-sm text-slate-weathered">
          No sections found. Apply the CMS migration to seed default sections.
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
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold-muted">
                {section.slug}
              </p>
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
    </AdminSection>
  );
}

// --- FAQs ---------------------------------------------------------------------

function FaqManager() {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    await load();
  }

  async function patch(id: string, payload: Partial<FaqRow>) {
    setBusyId(id);
    setError(null);
    const { error: e } = await updateFaq(id, payload);
    setBusyId(null);
    if (e) return setError(e);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ permanently?")) return;
    setBusyId(id);
    setError(null);
    const { error: e } = await deleteFaq(id);
    setBusyId(null);
    if (e) return setError(e);
    await load();
  }

  async function move(index: number, dir: -1 | 1) {
    const target = faqs[index];
    const swap = faqs[index + dir];
    if (!target || !swap) return;
    setBusyId(target.id);
    setError(null);
    await updateFaq(target.id, { display_order: swap.display_order });
    await updateFaq(swap.id, { display_order: target.display_order });
    setBusyId(null);
    await load();
  }

  return (
    <AdminSection
      eyebrow="Public · FAQ"
      title="FAQ Manager"
      description="Add, edit, reorder, publish, and remove frequently asked questions."
      deck
    >
      <div className="space-y-5">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}

        <div className="border border-gold/40 bg-parchment-deep/60 p-4 space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal">
            Add a FAQ
          </p>
          <AdminField label="Question" value={newQ} onChange={setNewQ} />
          <AdminTextArea label="Answer" rows={3} value={newA} onChange={setNewA} />
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
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void patch(faq.id, {
                        question: faq.question,
                        answer: faq.answer,
                      })
                    }
                    disabled={busyId === faq.id}
                    className="focus-ring btn-primary px-4 py-2 text-sm tracking-wide disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void patch(faq.id, { is_published: !faq.is_published })
                    }
                    disabled={busyId === faq.id}
                    className="focus-ring px-1 text-sm text-charcoal underline underline-offset-4 disabled:opacity-60"
                  >
                    {faq.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(i, -1)}
                    disabled={busyId === faq.id || i === 0}
                    className="focus-ring px-1 text-sm text-slate-weathered underline underline-offset-4 disabled:opacity-30"
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(i, 1)}
                    disabled={busyId === faq.id || i === faqs.length - 1}
                    className="focus-ring px-1 text-sm text-slate-weathered underline underline-offset-4 disabled:opacity-30"
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
                    onClick={() => void remove(faq.id)}
                    disabled={busyId === faq.id}
                    className="focus-ring ml-auto px-1 text-sm text-crimson underline underline-offset-4 disabled:opacity-60"
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
