"use client";

import type { ReactNode } from "react";
import { useContactModal } from "@/components/contact/ContactModalContext";

/**
 * Client trigger that opens the shared contact modal. Lets server components
 * (e.g. the footer) surface a "Contact Lodge" action without going client.
 */
export function ContactButton({
  subject,
  className,
  children,
}: {
  subject?: string;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useContactModal();
  return (
    <button type="button" onClick={() => open(subject)} className={className}>
      {children}
    </button>
  );
}
