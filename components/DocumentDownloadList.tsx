"use client";

import { useEffect, useState } from "react";
import { fetchDocuments } from "@/lib/supabase/cms";
import type { PublicDocument } from "@/lib/supabase/database.types";

function groupByCategory(
  docs: PublicDocument[]
): { category: string; items: PublicDocument[] }[] {
  const map = new Map<string, PublicDocument[]>();
  for (const doc of docs) {
    const key = doc.category.trim() || "General";
    const list = map.get(key) ?? [];
    list.push(doc);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export function DocumentDownloadList({
  heading = "Lodge Documents",
}: {
  heading?: string;
}) {
  const [docs, setDocs] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchDocuments().then((data) => {
      if (cancelled) return;
      setDocs(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || docs.length === 0) return null;

  const groups = groupByCategory(docs);

  return (
    <section
      id="documents"
      className="scroll-mt-24 bg-parchment-deep/50 py-16 sm:py-20"
      aria-labelledby="documents-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
          Downloads
        </p>
        <h2
          id="documents-heading"
          className="font-display text-charcoal text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-8"
        >
          {heading}
        </h2>

        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold-muted mb-3">
                {group.category}
              </h3>
              <ul className="divide-y divide-charcoal/12 border border-charcoal/12 bg-white/70">
                {group.items.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring group flex items-center justify-between gap-4 px-4 py-3.5 museum-ease hover:bg-parchment-deep/40"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <svg className="h-5 w-5 shrink-0 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-body text-charcoal truncate group-hover:text-crimson">
                          {doc.title}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-slate-weathered">
                        Download →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
