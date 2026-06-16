"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { imageUrl, isImageMissing } from "@/lib/tmdb";

export type RowCard = {
  key: string;
  poster_path: string | null;
  title: string;
  onClick: () => void;
  rank?: number;
  meta?: string;
  year?: string;
};

function PosterCard({
  poster_path,
  title,
  onClick,
  rank,
  meta,
  year,
}: Omit<RowCard, "key">) {
  const missing = isImageMissing(poster_path);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/card relative shrink-0 basis-[42%] sm:basis-[29%] md:basis-[22%] lg:basis-[16.5%]"
    >
      <div className="relative z-10 aspect-2/3 w-full overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover/card:-translate-y-1 group-hover/card:ring-2 group-hover/card:ring-primary/60 group-hover/card:shadow-2xl group-hover/card:shadow-primary/25">
        {missing ? (
          <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
        ) : (
          <Image
            src={imageUrl(poster_path)}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 16vw"
          />
        )}
        {missing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-2 text-center text-xs font-semibold text-white">
            Image not available
          </div>
        )}

        {/* hover veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

        {/* date (hover) */}
        {year && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover/card:opacity-100">
            {year}
          </span>
        )}

        {/* rating (hover) */}
        {meta && (
          <span className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300 opacity-0 backdrop-blur transition-opacity duration-300 group-hover/card:opacity-100">
            <Star className="h-3 w-3 fill-amber-300" />
            {meta}
          </span>
        )}

        {/* title (hover) */}
        <div className="absolute inset-x-0 bottom-0 translate-y-1 p-2.5 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
          <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">
            {title}
          </p>
        </div>
      </div>

      {/* rank number */}
      {rank !== undefined && (
        <span
          className="pointer-events-none absolute -bottom-2 -left-3 z-20 select-none text-[4rem] font-extrabold leading-none text-black md:-left-4 md:text-[5.5rem]"
          style={{ WebkitTextStroke: "2px #fff" }}
        >
          {rank}
        </span>
      )}
    </button>
  );
}

export default function MediaRow({
  title,
  seeMoreHref,
  cards,
}: {
  title: string;
  seeMoreHref?: string;
  cards: RowCard[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 2,
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

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
  }, [emblaApi, onSelect]);

  if (cards.length === 0) return null;

  return (
    <section className="relative z-10 px-6 pb-12 md:px-12">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
          {title}
        </h2>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className="group/see inline-flex items-center gap-1 text-sm font-semibold text-white/60 transition-colors hover:text-primary"
          >
            See all
            <ChevronRight className="h-4 w-4 transition-transform group-hover/see:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="group relative">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black to-transparent md:w-12" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black to-transparent md:w-12" />

        {canPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Scroll left"
            className="absolute left-1 top-[42%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 ring-1 ring-white/15 backdrop-blur transition-all hover:bg-primary hover:ring-primary group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div ref={emblaRef} className="overflow-hidden px-9 md:px-12">
          <div className="flex gap-3 py-4 md:gap-5">
            {cards.map(({ key, ...card }) => (
              <PosterCard key={key} {...card} />
            ))}
          </div>
        </div>

        {canNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Scroll right"
            className="absolute right-1 top-[42%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 ring-1 ring-white/15 backdrop-blur transition-all hover:bg-primary hover:ring-primary group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}
