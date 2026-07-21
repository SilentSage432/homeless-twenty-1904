"use client";

import { useEffect, useState } from "react";
import { fetchFaqs } from "@/lib/supabase/cms";
import type { FaqRow } from "@/lib/supabase/database.types";

export function FaqAccordion({ heading = "Frequently Asked Questions" }: { heading?: string }) {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchFaqs(true).then((data) => {
      if (cancelled) return;
      setFaqs(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || faqs.length === 0) return null;

  return (
    <section
      id="faq"
      className="scroll-mt-24 py-16 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
          Questions & Answers
        </p>
        <h2
          id="faq-heading"
          className="font-display text-charcoal text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-8"
        >
          {heading}
        </h2>

        <ul className="divide-y divide-charcoal/12 border-y border-charcoal/12">
          {faqs.map((faq) => {
            const open = openId === faq.id;
            return (
              <li key={faq.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : faq.id)}
                  className="focus-ring flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="font-display text-lg text-charcoal">
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 text-gold transition-transform duration-200 ${open ? "rotate-45" : ""}`}
                    aria-hidden="true"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>
                {open ? (
                  <div className="pb-5 pr-8">
                    <p className="whitespace-pre-wrap font-body text-base leading-relaxed text-slate-weathered">
                      {faq.answer}
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
