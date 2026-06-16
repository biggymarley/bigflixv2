"use client";

import type { RefObject } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "@/components/movie-card";
import type { Movie } from "@/lib/types";

const GRID_CLASS =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

interface MovieGridProps {
  items: Movie[];
  loading: boolean;
  loadingMore: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  mediaType: "movie" | "tv";
  onInfoClick: (movie: Movie) => void;
  emptyMessage: string;
}

/** Responsive movie grid with loading skeletons, an empty state, and an
 * infinite-scroll sentinel. Pair with {@link useInfiniteTmdb}. */
export default function MovieGrid({
  items,
  loading,
  loadingMore,
  loadMoreRef,
  mediaType,
  onInfoClick,
  emptyMessage,
}: MovieGridProps) {
  if (loading) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-white/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className={GRID_CLASS}>
        {items.map((item) => (
          <MovieCard
            key={`${item.id}-${item.media_type || mediaType}`}
            movie={item}
            mediaType={mediaType}
            onInfoClick={onInfoClick}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="mt-8 h-12">
        {loadingMore && (
          <div className={GRID_CLASS}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 w-full rounded-md" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
