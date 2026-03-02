"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import MovieCard from "@/components/movie-card";
import InfoModal from "@/components/info-modal";
import type { Movie, TMDBResponse } from "@/lib/types";

export default function BrowsePage() {
  const params = useParams();
  const query = decodeURIComponent(params.query as string);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const hasMorePages = page < totalPages;

  useEffect(() => {
    if (!query) return;
    setMovies([]);
    setPage(1);
    setTotalPages(1);
  }, [query]);

  useEffect(() => {
    if (!query) return;

    const controller = new AbortController();
    const isFirstPage = page === 1;

    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}&page=${page}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: TMDBResponse<Movie>) => {
        const results = data.results || [];
        setMovies((prev) => {
          if (isFirstPage) return results;
          const existingIds = new Set(prev.map((movie) => `${movie.media_type}-${movie.id}`));
          const uniqueResults = results.filter(
            (movie) => !existingIds.has(`${movie.media_type}-${movie.id}`)
          );
          return [...prev, ...uniqueResults];
        });
        setTotalPages(data.total_pages || 1);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError" && isFirstPage) {
          setMovies([]);
        }
      })
      .finally(() => {
        if (isFirstPage) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      });

    return () => controller.abort();
  }, [page, query]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMorePages) return;
    setPage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-12">
        <h1 className="mb-6 text-2xl font-bold text-white">
          Search results for &ldquo;{query}&rdquo;
        </h1>

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
                  key={`${movie.media_type}-${movie.id}`}
                  movie={movie}
                  onInfoClick={setSelectedMovie}
                />
              ))}
            </div>
            {loadingMore && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={`load-more-${i}`}
                    className="aspect-2/3 w-full rounded-md"
                  />
                ))}
              </div>
            )}
            {hasMorePages && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="min-w-36"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg text-white/60">
              No results found for &ldquo;{query}&rdquo;
            </p>
            <p className="mt-2 text-sm text-white/40">
              Try searching for something else
            </p>
          </div>
        )}
      </div>

      <InfoModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}
