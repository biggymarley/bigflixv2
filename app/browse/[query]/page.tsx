"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/header";
import MovieCard from "@/components/movie-card";
import InfoModal from "@/components/info-modal";
import type { Movie } from "@/lib/types";

export default function BrowsePage() {
  const params = useParams();
  const query = decodeURIComponent(params.query as string);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}&page=1`)
      .then((res) => res.json())
      .then((data) => setMovies(data.results || []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [query]);

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
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onInfoClick={setSelectedMovie}
              />
            ))}
          </div>
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
