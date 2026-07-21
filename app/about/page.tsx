import type { Metadata } from "next";
import { AboutSection } from "@/components/about/AboutSection";
import { FaqAccordion } from "@/components/FaqAccordion";
import { DocumentDownloadList } from "@/components/DocumentDownloadList";
import { fetchSection } from "@/lib/supabase/cms";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Homeless Twenty 1904 — guardians of Magic Valley lore and western heritage across Southern and Eastern Idaho.",
};

// Revalidate so CMS-managed section copy refreshes without a redeploy.
export const revalidate = 30;

export default async function AboutPage() {
  const president = await fetchSection("president-message").catch(() => null);
  const presidentHtml = president?.content?.trim() || null;

  return (
    <div className="pt-20">
      <AboutSection />

      {presidentHtml ? (
        <section className="scroll-mt-24 bg-charcoal py-16 sm:py-20" aria-labelledby="president-heading">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-gold text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
              From the Lodge
            </p>
            <h2
              id="president-heading"
              className="font-display text-parchment text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-6"
            >
              {president?.title?.trim() || "A Word from the President"}
            </h2>
            <div
              className="cms-prose font-body text-lg leading-[1.85] text-parchment/85 space-y-6"
              dangerouslySetInnerHTML={{ __html: presidentHtml }}
            />
          </div>
        </section>
      ) : null}

      <FaqAccordion />
      <DocumentDownloadList />
    </div>
  );
}
