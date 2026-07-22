import type { Metadata } from "next";
import { ContactButton } from "@/components/contact/ContactButton";
import { CmsText } from "@/components/CmsText";
import { getContentSection } from "@/lib/supabase/cms";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Homeless Twenty 1904 lodge leadership about plaques, events, membership, or local history.",
  robots: { index: true, follow: true },
};

export const revalidate = 30;

export default async function ContactPage() {
  const intro = await getContentSection("contact_intro");

  return (
    <div className="pt-20 min-h-[70vh] bg-parchment-warm/40">
      <section
        className="py-16 sm:py-24"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
            Get in touch
          </p>
          <h1
            id="contact-heading"
            className="font-display text-charcoal text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-5"
          >
            {intro.title || "Contact the Lodge"}
          </h1>
          <div className="mx-auto mb-6 h-px w-16 bg-gold" aria-hidden="true" />
          <CmsText
            content={intro.content}
            className="font-body text-lg leading-relaxed text-slate-weathered mb-10"
          />
          <ContactButton
            subject="General Inquiry"
            className="focus-ring btn-primary inline-flex min-h-[44px] items-center px-8 py-3.5 text-base tracking-wide"
          >
            Send a message
          </ContactButton>
          <p className="mt-6 text-sm text-slate-weathered">
            Or browse{" "}
            <a
              href="/events"
              className="focus-ring text-crimson underline underline-offset-4"
            >
              upcoming events
            </a>{" "}
            and the{" "}
            <a
              href="/plaques"
              className="focus-ring text-crimson underline underline-offset-4"
            >
              Plaque Gallery
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
