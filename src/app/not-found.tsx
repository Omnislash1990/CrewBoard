import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-stone-50 px-6 text-center">
      <Logo />
      <h1 className="font-[family-name:var(--font-barlow)] text-2xl font-semibold text-stone-900">
        Page not found
      </h1>
      <Link href="/" className="text-sm font-medium text-orange-700 hover:underline">
        Back to CrewBoard
      </Link>
    </div>
  );
}
