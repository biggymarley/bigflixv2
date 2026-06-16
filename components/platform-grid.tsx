"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "@/components/movie-card";
import { WATCH_REGION } from "@/lib/platforms";
import type { Movie, TMDBResponse } from "@/lib/types";

interface PlatformGridProps {
  providerId: number;
  mediaType: "movie" | "tv";
  onInfoClick: (movie: Movie) => void;
}

export default function PlatformGrid({
  providerId,
  mediaType,
  onInfoClick,
}: PlatformGridProps) {
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const endpoint = mediaType === "movie" ? "discover/movie" : "discover/tv";

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          with_watch_providers: String(providerId),
          watch_region: WATCH_REGION,
          sort_by: "popularity.desc",
        });
        const res = await fetch(`/api/tmdb/${endpoint}?${params.toString()}`);
        const data = (await res.json()) as TMDBResponse<Movie>;
        const results = data.results || [];

        setItems((prev) => (append ? [...prev, ...results] : results));
        setPage(data.page || nextPage);
        setTotalPages(Math.min(data.total_pages || 1, 500));
      } catch {
        if (!append) setItems([]);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [endpoint, providerId]
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (loading || loadingMore || page >= totalPages || !loadMoreRef.current)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchPage(page + 1, true);
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchPage, loading, loadingMore, page, totalPages]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-white/60">Nothing found here yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <MovieCard
            key={`${item.id}-${mediaType}`}
            movie={item}
            mediaType={mediaType}
            onInfoClick={onInfoClick}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="mt-8 h-12">
        {loadingMore && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 w-full rounded-md" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
