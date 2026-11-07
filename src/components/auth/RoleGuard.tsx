"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { homePathForRole } from "@/lib/auth/session-payload";
import type { UserRole } from "@/types";

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { loading, profile, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!configured || !profile) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(profile.role)) {
      router.replace(homePathForRole(profile.role));
    }
  }, [allowedRoles, configured, loading, profile, router]);

  if (loading) {
    return <FullPageSpinner />;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <FullPageSpinner label="Redirecting" />;
  }

  return <>{children}</>;
}
