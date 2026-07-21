"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchSiteSettings } from "@/lib/supabase/cms";
import type { AnnouncementBanner as Banner } from "@/lib/supabase/database.types";

const TYPE_STYLES: Record<Banner["type"], string> = {
  info: "bg-charcoal text-parchment border-gold/40",
  alert: "bg-crimson text-parchment border-crimson-deep",
  event: "bg-gold text-charcoal border-gold-light",
};

const TYPE_LABEL: Record<Banner["type"], string> = {
  info: "Notice",
  alert: "Alert",
  event: "Event",
};

/** Pure presentational bar — shared by the public banner and the admin preview. */
export function AnnouncementBannerView({
  banner,
  onDismiss,
  preview = false,
}: {
  banner: Banner;
  onDismiss?: () => void;
  preview?: boolean;
}) {
  const tone = TYPE_STYLES[banner.type] ?? TYPE_STYLES.info;
  const eyebrowTone = banner.type === "event" ? "text-charcoal/70" : "text-gold";

  return (
    <div className={`border-b ${tone} ${preview ? "" : "shadow-[var(--shadow-lift)]"}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <span
          className={`hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] sm:inline ${eyebrowTone}`}
        >
          {TYPE_LABEL[banner.type] ?? "Notice"}
        </span>
        <p className="min-w-0 flex-1 font-body text-sm leading-snug">
          {banner.message || (preview ? "Your announcement message appears here." : "")}
          {banner.link_url ? (
            preview ? (
              <span className="ml-2 underline underline-offset-2 opacity-80">
                Learn more →
              </span>
            ) : (
              <Link
                href={banner.link_url}
                className="focus-ring ml-2 underline underline-offset-2 opacity-90 hover:opacity-100"
              >
                Learn more →
              </Link>
            )
          ) : null}
        </p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="focus-ring -mr-1 flex h-8 w-8 shrink-0 items-center justify-center opacity-70 hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

function dismissKey(banner: Banner): string {
  // Re-show when the message changes.
  return `ht-ann-dismissed:${banner.type}:${banner.message}`;
}

/** Public announcement bar: fixed to the top, dismissible per browser session. */
export function AnnouncementBanner() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    void fetchSiteSettings().then((settings) => {
      if (cancelled) return;
      const b = settings.announcement_banner;
      setBanner(b);
      if (typeof window !== "undefined") {
        setDismissed(sessionStorage.getItem(dismissKey(b)) === "1");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const visible = useMemo(
    () => !isAdmin && !!banner?.enabled && !!banner.message.trim() && !dismissed,
    [isAdmin, banner, dismissed]
  );

  // Publish the bar height so the fixed header + page content offset cleanly.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible || !ref.current) {
      root.style.setProperty("--ann-height", "0px");
      return;
    }
    const setVar = () => {
      root.style.setProperty("--ann-height", `${ref.current?.offsetHeight ?? 0}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      root.style.setProperty("--ann-height", "0px");
    };
  }, [visible]);

  if (!visible || !banner) return null;

  return (
    <div ref={ref} className="fixed inset-x-0 top-0 z-[60]">
      <AnnouncementBannerView
        banner={banner}
        onDismiss={() => {
          sessionStorage.setItem(dismissKey(banner), "1");
          setDismissed(true);
        }}
      />
    </div>
  );
}
