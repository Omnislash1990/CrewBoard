import type { Metadata } from "next";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { RequireRole } from "@/components/auth/RequireRole";

export const metadata: Metadata = {
  title: "Rota",
};

export default function RotaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole role="worker">
      <EmailVerificationBanner />
      {children}
    </RequireRole>
  );
}
