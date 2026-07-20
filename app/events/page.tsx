import type { Metadata } from "next";
import { EventsBoard } from "@/components/events/EventsBoard";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming Homeless Twenty 1904 gatherings, dedications, and heritage dinners — with pre-pay when available.",
};

export default function EventsPage() {
  return (
    <div className="pt-16">
      <EventsBoard />
    </div>
  );
}
