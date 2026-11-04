"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { homePathForRole } from "@/lib/auth/session-payload";

export function HomeGate() {
  const { loading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(profile ? homePathForRole(profile.role) : "/login");
  }, [loading, profile, router]);

  return <FullPageSpinner />;
}
