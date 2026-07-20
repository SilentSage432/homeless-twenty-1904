"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#top", label: "Home", hash: "top" },
  { href: "/#about", label: "About Us", hash: "about" },
  { href: "/#plaques", label: "Historical Plaques", hash: "plaques" },
  { href: "/#events", label: "Events", hash: "events" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("top");
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;

    const syncHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      setActiveHash(raw || "top");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  if (isAdmin) {
    return (
      <header className="bg-charcoal border-b border-gold/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="focus-ring font-display text-parchment text-sm tracking-wide hover:text-gold"
          >
            ← Back to site
          </Link>
          <span className="text-gold text-xs tracking-[0.2em] uppercase">
            {pathname.includes("/dashboard") ? "Dashboard" : "Admin"}
          </span>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-shadow duration-300",
        scrolled
          ? "bg-charcoal/95 shadow-[var(--shadow-lift)] backdrop-blur-sm"
          : "bg-charcoal"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 sm:h-[4.5rem] items-center justify-between gap-4">
          <Link
            href="/#top"
            className="focus-ring group flex items-center gap-3 min-w-0"
            aria-label="Homeless Twenty 1904 — Home"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/70 text-gold font-display text-sm font-bold tracking-wider"
              aria-hidden="true"
            >
              H20
            </span>
            <span className="min-w-0">
              <span className="block font-display text-parchment text-base sm:text-lg leading-tight tracking-wide truncate">
                Homeless Twenty
              </span>
              <span className="block text-[10px] sm:text-xs tracking-[0.2em] uppercase text-gold/90">
                1904
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
            {NAV.map((item) => {
              const active = pathname === "/" && activeHash === item.hash;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "focus-ring text-sm tracking-wide transition-colors relative after:absolute after:left-0 after:bottom-[-2px] after:h-px after:bg-gold after:transition-[width] after:duration-250 after:w-0 hover:after:w-full",
                    active
                      ? "text-gold after:w-full"
                      : "text-parchment/85 hover:text-gold"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/#events"
              className="focus-ring btn-primary inline-flex items-center px-4 py-2 text-sm font-body tracking-wide"
            >
              View Events
            </Link>
          </nav>

          <button
            type="button"
            className="lg:hidden focus-ring flex h-11 w-11 items-center justify-center text-parchment border border-parchment/30"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="lg:hidden border-t border-parchment/10 bg-charcoal"
        >
          <nav
            className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1"
            aria-label="Mobile"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring block px-3 py-3 text-parchment/90 hover:text-gold hover:bg-white/5 text-base"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#events"
              className="focus-ring btn-primary mt-2 text-center px-3 py-3 text-base"
              onClick={() => setMobileOpen(false)}
            >
              View Upcoming Events
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
