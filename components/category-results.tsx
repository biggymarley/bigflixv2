"use client";

import { useState } from "react";
import MovieGrid from "@/components/movie-grid";
import InfoModal from "@/components/info-modal";
import { useInfiniteTmdb } from "@/hooks/use-infinite-tmdb";
import type { Movie } from "@/lib/types";

interface CategoryResultsProps {
  endpoint: string;
  genreId: string;
  mediaType: "movie" | "tv";
}

export default function CategoryResults({
  endpoint,
  genreId,
  mediaType,
}: CategoryResultsProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const { items, loading, loadingMore, loadMoreRef } = useInfiniteTmdb({
    endpoint,
    params: {
      with_genres: genreId,
      sort_by: "vote_average.desc",
      "vote_count.gte": "100",
    },
  });

  return (
    <>
      <MovieGrid
        items={items}
        loading={loading}
        loadingMore={loadingMore}
        loadMoreRef={loadMoreRef}
        mediaType={mediaType}
        onInfoClick={setSelectedMovie}
        emptyMessage="No titles found in this category"
      />

      <InfoModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </>
  );
}
