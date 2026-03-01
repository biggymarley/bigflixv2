"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "@/components/movie-card";
import type { Movie, SliderMode } from "@/lib/types";

interface MovieSliderProps {
  mode: SliderMode;
  onInfoClick?: (movie: Movie) => void;
}

export default function MovieSlider({ mode, onInfoClick }: MovieSliderProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 3,
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

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

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="space-y-3">
      <h2 className="px-4 text-lg font-semibold text-white md:px-0">
        {mode.label}
      </h2>
      <div className="group relative">
        {canScrollPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-0 z-10 hidden h-full w-10 rounded-none bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 md:flex"
            onClick={() => emblaApi?.scrollPrev()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-2 px-4 md:px-0">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="w-[140px] flex-shrink-0 md:w-[180px]">
                    <Skeleton className="aspect-[2/3] w-full rounded-md" />
                  </div>
                ))
              : movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="w-[140px] flex-shrink-0 md:w-[180px]"
                  >
                    <MovieCard
                      movie={movie}
                      mediaType={mode.type || "movie"}
                      onInfoClick={onInfoClick}
                    />
                  </div>
                ))}
          </div>
        </div>

        {canScrollNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 z-10 hidden h-full w-10 rounded-none bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 md:flex"
            onClick={() => emblaApi?.scrollNext()}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
