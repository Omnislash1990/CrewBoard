"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { homePathForRole } from "@/lib/auth/session-payload";
import type { UserRole } from "@/types";

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
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
    if (profile.role !== role) {
      router.replace(homePathForRole(profile.role));
    }
  }, [configured, loading, profile, role, router]);

  if (loading) {
    return <FullPageSpinner />;
  }

  if (!profile || profile.role !== role) {
    return <FullPageSpinner label="Redirecting" />;
  }

  return <>{children}</>;
}
