import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { RoleGuard } from "@/components/auth/RoleGuard";

const ADMIN_ROLES = ["admin"] as const;

export const metadata: Metadata = {
  title: "Dispatch",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={ADMIN_ROLES}>
      <div className="min-h-dvh bg-slate-50">
        <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              CrewBoard
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              Office portal
            </p>
          </div>
          <AdminNav className="flex flex-1 flex-col gap-1 px-3 py-4" />
        </aside>

        <div className="md:pl-64">
          <header className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <AdminNav className="flex gap-2" />
          </header>
          <main className="p-6 md:p-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
