import type { Metadata } from "next";
import { CrewManager } from "@/components/admin/CrewManager";

export const metadata: Metadata = {
  title: "Crew",
};

export default function CrewPage() {
  return <CrewManager />;
}
