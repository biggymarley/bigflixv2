"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { Platform } from "@/lib/platforms";
import { imageUrl } from "@/lib/tmdb";

export default function PlatformRail() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => {
    fetch("/api/platforms")
      .then((r) => r.json())
      .then((data: Platform[]) => setPlatforms(Array.isArray(data) ? data : []))
      .catch(() => setPlatforms([]));
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect, platforms]);

  if (platforms.length === 0) return null;

  return (
    <section className="relative z-10 bg-black px-6 py-10 md:px-12">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.3em] text-white/40">
        Browse by platform
      </p>

      <div className="group relative">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black to-transparent md:w-12" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black to-transparent md:w-12" />

        {canPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Scroll left"
            className="absolute left-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 ring-1 ring-white/15 backdrop-blur transition-all hover:bg-primary hover:ring-primary group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div ref={emblaRef} className="overflow-hidden px-9 md:px-12">
          <div className="flex gap-5 px-1 py-5 md:gap-8">
            {platforms.map((platform) => (
              <Link
                key={platform.slug}
                href={`/platform/${platform.slug}`}
                className="group/card flex shrink-0 flex-col items-center gap-2"
                title={platform.name}
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all duration-300 group-hover/card:-translate-y-1.5 group-hover/card:scale-105 group-hover/card:ring-2 group-hover/card:ring-primary/60 group-hover/card:shadow-xl group-hover/card:shadow-primary/25 md:h-24 md:w-24">
                  <Image
                    src={imageUrl(platform.logoPath, "w300")}
                    alt={platform.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <span className="max-w-24 truncate text-xs font-medium text-white/60 transition-colors group-hover/card:text-white">
                  {platform.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {canNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Scroll right"
            className="absolute right-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 ring-1 ring-white/15 backdrop-blur transition-all hover:bg-primary hover:ring-primary group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}
