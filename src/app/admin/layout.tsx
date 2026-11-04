import type { Metadata } from "next";
import { RequireRole } from "@/components/auth/RequireRole";

export const metadata: Metadata = {
  title: "Dispatch",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireRole role="admin">{children}</RequireRole>;
}
