"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/watch")) {
      sessionStorage.setItem("preWatchPath", pathname);
    }
  }, [pathname]);

  return null;
}
