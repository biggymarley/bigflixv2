"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MediaRow, { type RowCard } from "@/components/media-row";
import type { Movie, SliderMode } from "@/lib/types";

interface MovieSliderProps {
  mode: SliderMode;
  onInfoClick?: (movie: Movie) => void;
}

function SkeletonRow({ title }: { title: string }) {
  return (
    <section className="relative z-10 px-6 pb-12 md:px-12">
      <div className="mb-3">
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
          {title}
        </h2>
      </div>
      <div className="flex gap-3 overflow-hidden px-9 py-4 md:gap-5 md:px-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-2/3 shrink-0 basis-[42%] rounded-xl sm:basis-[29%] md:basis-[22%] lg:basis-[16.5%]"
          />
        ))}
      </div>
    </section>
  );
}

export default function MovieSlider({ mode, onInfoClick }: MovieSliderProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const type = mode.type || "movie";
  const discoverType = type === "movie" ? "movies" : "series";
  const isCategorySlider = !!mode.params?.with_genres;
  const seeMoreHref = mode.params?.with_genres
    ? `/discover/${discoverType}/category/${mode.params.with_genres}`
    : `/discover/${discoverType}`;

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: "1" });
        if (mode.params) {
          Object.entries(mode.params).forEach(([k, v]) => params.set(k, v));
        }
        const res = await fetch(`/api/tmdb/${mode.api}?${params.toString()}`);
        const data = await res.json();
        setMovies(data.results || []);
      } catch {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [mode]);

  if (loading) {
    return <SkeletonRow title={mode.label} />;
  }

  const cards: RowCard[] = movies.map((movie) => ({
    key: String(movie.id),
    poster_path: movie.poster_path,
    title: movie.title || movie.name || "Untitled",
    year: (movie.release_date || movie.first_air_date)?.split("-")[0] || undefined,
    meta: movie.vote_average ? movie.vote_average.toFixed(1) : undefined,
    onClick: () => onInfoClick?.({ ...movie, media_type: type }),
  }));

  return (
    <MediaRow
      title={mode.label}
      seeMoreHref={isCategorySlider ? seeMoreHref : undefined}
      cards={cards}
    />
  );
}
