"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/supabase/content";
import { formatEventDate } from "@/lib/utils";

export function EventsBoard({ heading = true }: { heading?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  const events = data?.data ?? [];
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= Date.now() - 86_400_000);

  return (
    <section
      id="events"
      className="scroll-mt-24 py-20 sm:py-28"
      aria-labelledby="events-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {heading && (
          <div className="max-w-2xl mb-14">
            <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
              Gatherings &amp; Commemorations
            </p>
            <h2
              id="events-heading"
              className="font-display text-charcoal text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-5"
            >
              Upcoming Events
            </h2>
            <div className="h-px w-16 bg-gold mb-5" aria-hidden="true" />
            <p className="font-body text-lg leading-relaxed text-slate-weathered">
              Join us for dinners, trail markers, and fellowship across the Magic
              Valley. Pre-pay when ready — secure payment links appear when each
              event opens.
            </p>
          </div>
        )}

        {isLoading && (
          <p className="text-slate-weathered font-body">Loading events…</p>
        )}

        {!isLoading && upcoming.length === 0 && (
          <p className="font-body text-lg text-slate-weathered">
            No upcoming events posted. Check back soon, or contact the lodge.
          </p>
        )}

        <div className="space-y-8" role="list">
          {upcoming.map((event) => {
            const d = formatEventDate(event.date);
            const paymentUrl = event.payment_url?.trim() ?? "";
            const payReady = paymentUrl.length > 0;
            const imageUrl = event.image_url?.trim() ?? "";

            return (
              <article
                key={event.id}
                className="museum-card border border-charcoal/10 bg-white/60 shadow-[var(--shadow-panel)] overflow-hidden"
                role="listitem"
              >
                {imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden border-b border-charcoal/10 bg-charcoal sm:h-64">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`${event.title} event image`}
                      className="h-full w-full object-cover museum-media"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="grid md:grid-cols-12">
                  <div className="md:col-span-3 bg-charcoal text-parchment px-6 py-6 sm:py-8 flex md:flex-col items-center md:items-start justify-between md:justify-center gap-4">
                    <div>
                      <p className="text-gold text-xs tracking-[0.2em] uppercase mb-1">
                        {d.month}
                      </p>
                      <p className="font-display text-5xl font-bold leading-none">
                        {d.day}
                      </p>
                      <p className="mt-1 text-parchment/70 text-sm">{d.year}</p>
                    </div>
                    <p className="text-sm text-parchment/80 md:mt-4">{d.time}</p>
                  </div>

                  <div className="md:col-span-5 px-6 py-6 sm:py-8 border-b md:border-b-0 md:border-r border-charcoal/10">
                    {event.label && (
                      <span className="inline-block mb-3 text-xs tracking-[0.16em] uppercase border border-crimson/40 text-crimson px-2.5 py-1">
                        {event.label}
                      </span>
                    )}
                    <h3 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold leading-snug mb-3">
                      {event.title}
                    </h3>
                    <p className="font-body text-base leading-relaxed text-parchment-ink/85">
                      {event.description}
                    </p>
                  </div>

                  <div className="md:col-span-4 px-6 py-6 sm:py-8 bg-parchment-deep/40 flex flex-col justify-center">
                    <p className="text-xs tracking-[0.18em] uppercase text-slate-weathered mb-2">
                      Registration
                    </p>
                    {payReady ? (
                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring btn-primary inline-flex items-center justify-center px-5 py-3 text-base tracking-wide w-full sm:w-auto"
                        aria-label={`Register for ${event.title}`}
                      >
                        Register / Pre-Pay
                      </a>
                    ) : (
                      <>
                        <span
                          className="inline-flex items-center justify-center px-5 py-3 text-base tracking-wide w-full sm:w-auto border border-charcoal/20 bg-parchment/80 text-slate-weathered cursor-not-allowed"
                          aria-disabled="true"
                        >
                          Registration Unavailable
                        </span>
                        <p className="mt-3 text-xs text-slate-weathered leading-relaxed">
                          A live payment link has not been published for this
                          event yet. Contact the lodge to reserve a seat.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
