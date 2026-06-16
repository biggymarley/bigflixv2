"use client";

import MovieGrid from "@/components/movie-grid";
import { useInfiniteTmdb } from "@/hooks/use-infinite-tmdb";
import { WATCH_REGION } from "@/lib/platforms";
import type { Movie } from "@/lib/types";

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
  const endpoint = mediaType === "movie" ? "discover/movie" : "discover/tv";

  const { items, loading, loadingMore, loadMoreRef } = useInfiniteTmdb({
    endpoint,
    params: {
      with_watch_providers: String(providerId),
      watch_region: WATCH_REGION,
      sort_by: "popularity.desc",
    },
    maxPages: 500,
    rootMargin: "300px",
  });

  return (
    <MovieGrid
      items={items}
      loading={loading}
      loadingMore={loadingMore}
      loadMoreRef={loadMoreRef}
      mediaType={mediaType}
      onInfoClick={onInfoClick}
      emptyMessage="Nothing found here yet"
    />
  );
}
