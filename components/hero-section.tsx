"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/lib/types";
import { backdropUrl } from "@/lib/tmdb";

interface HeroSectionProps {
  movie: Movie;
  onInfoClick?: (movie: Movie) => void;
  mediaType?: "movie" | "tv";
}

export default function HeroSection({
  movie,
  onInfoClick,
  mediaType = "movie",
}: HeroSectionProps) {
  const title = movie.title || movie.name || "Untitled";
  const year =
    (movie.release_date || movie.first_air_date)?.split("-")[0] || "";
  const watchUrl =
    mediaType === "tv"
      ? `/watch/${movie.id}?type=tv`
      : `/watch/${movie.id}`;

  return (
    <div className="relative h-[70vh] w-full overflow-hidden">
      <Image
        src={backdropUrl(movie.backdrop_path)}
        alt={title}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

      <div className="absolute bottom-16 left-0 max-w-xl space-y-4 px-6 md:bottom-24 md:px-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-5xl">
          {title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-white/70">
          {year && <span className="font-medium">{year}</span>}
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            {movie.vote_average?.toFixed(1)}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-white/80 md:text-base">
          {movie.overview}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button asChild size="lg" className="gap-2 font-semibold">
            <Link href={watchUrl}>
              <Play className="h-5 w-5" />
              Play
            </Link>
          </Button>
          {onInfoClick && (
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 font-semibold"
              onClick={() =>
                onInfoClick({ ...movie, media_type: mediaType })
              }
            >
              <Info className="h-5 w-5" />
              More Info
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
