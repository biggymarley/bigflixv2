"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "@/components/movie-card";
import InfoModal from "@/components/info-modal";
import type { Movie, TMDBResponse } from "@/lib/types";

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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          with_genres: genreId,
          sort_by: "vote_average.desc",
          "vote_count.gte": "100",
        });
        const res = await fetch(`/api/tmdb/${endpoint}?${params.toString()}`);
        const data = (await res.json()) as TMDBResponse<Movie>;
        const results = data.results || [];

        setMovies((prev) => (append ? [...prev, ...results] : results));
        setPage(data.page || nextPage);
        setTotalPages(data.total_pages || 1);
      } catch {
        if (!append) setMovies([]);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [endpoint, genreId]
  );

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setTotalPages(1);
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (loading || loadingMore || page >= totalPages || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchPage(page + 1, true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchPage, loading, loadingMore, page, totalPages]);

  return (
    <>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <Skeleton key={i} className="aspect-2/3 w-full rounded-md" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie) => (
              <MovieCard
                key={`${movie.id}-${movie.media_type || mediaType}`}
                movie={movie}
                mediaType={mediaType}
                onInfoClick={setSelectedMovie}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-white/60">No titles found in this category</p>
        </div>
      )}

      <InfoModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </>
  );
}
