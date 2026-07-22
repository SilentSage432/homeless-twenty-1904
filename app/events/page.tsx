import type { Metadata } from "next";
import { EventsBoard } from "@/components/events/EventsBoard";
import { getContentSection } from "@/lib/supabase/cms";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming Homeless Twenty 1904 gatherings, dedications, and heritage dinners — with pre-pay when available.",
};

export const revalidate = 30;

export default async function EventsPage() {
  const intro = await getContentSection("events_intro");

  return (
    <div className="pt-16">
      <EventsBoard introTitle={intro.title} introBody={intro.content} />
    </div>
  );
}
