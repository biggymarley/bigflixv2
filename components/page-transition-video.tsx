"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const TRANSITION_DURATION_MS = 3000;

export default function PageTransitionVideo() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const routeKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams]
  );
  const previousRouteRef = useRef(routeKey);

  useEffect(() => {
    if (previousRouteRef.current === routeKey) return;

    previousRouteRef.current = routeKey;
    setIsVisible(true);

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, TRANSITION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [routeKey]);

  useEffect(() => {
    if (!isVisible || !videoRef.current) return;

    videoRef.current.currentTime = 0;
    void videoRef.current.play().catch(() => {
      // Ignore autoplay errors from restrictive browsers.
    });
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-200 bg-black">
      <video
        ref={videoRef}
        src="/intro.webm"
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
}
