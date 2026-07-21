import type { Metadata } from "next";
import { PlaquesExplorer } from "@/components/plaques/PlaquesExplorer";

export const metadata: Metadata = {
  title: "Historical Plaques Gallery",
  description:
    "Browse historical plaques placed by Homeless Twenty 1904 across the Magic Valley and Eastern Idaho — in a grid or on an interactive discovery map.",
};

export default function PlaquesPage() {
  return (
    <div className="pt-16">
      <PlaquesExplorer />
    </div>
  );
}
