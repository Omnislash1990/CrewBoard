"use client";

import { useEffect } from "react";

function shouldRegisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return false;
  if (process.env.NODE_ENV === "production") return true;
  // Dev registration is opt-in so the worker cannot intercept Next.js HMR.
  return process.env.NEXT_PUBLIC_ENABLE_SW === "1";
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!shouldRegisterServiceWorker()) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
