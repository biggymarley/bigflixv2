"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/header";
import MovieCard from "@/components/movie-card";
import InfoModal from "@/components/info-modal";
import { useWatchLater } from "@/hooks/use-watch-later";
import type { Movie, MovieDetails } from "@/lib/types";

type SavedTitle = MovieDetails & { savedType: "movie" | "tv" };

export default function WatchLaterPage() {
  const { items } = useWatchLater();
  const [savedTitles, setSavedTitles] = useState<SavedTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setSavedTitles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      items.map((item) =>
        fetch(
          `/api/tmdb/${item.type === "tv" ? "tv" : "movie"}/${item.id}`
        ).then((res) => res.json())
      )
    )
      .then((results) => {
        const normalized = results
          .filter(Boolean)
          .map((result, index) => ({
            ...result,
            savedType: items[index]?.type || "movie",
          })) as SavedTitle[];
        setSavedTitles(normalized);
      })
      .catch(() => setSavedTitles([]))
      .finally(() => setLoading(false));
  }, [items]);

  const movies = savedTitles.filter((title) => title.savedType === "movie");
  const tvShows = savedTitles.filter((title) => title.savedType === "tv");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-12">
        <h1 className="mb-6 text-2xl font-bold text-white">Watch Later</h1>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 w-full rounded-md" />
            ))}
          </div>
        ) : savedTitles.length > 0 ? (
          <div className="space-y-10">
            {movies.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-white">Movies</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {movies.map((movie) => (
                    <MovieCard
                      key={`movie-${movie.id}`}
                      movie={movie}
                      mediaType="movie"
                      onInfoClick={setSelectedMovie}
                    />
                  ))}
                </div>
              </section>
            )}

            {tvShows.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-white">TV Shows</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {tvShows.map((show) => (
                    <MovieCard
                      key={`tv-${show.id}`}
                      movie={show}
                      mediaType="tv"
                      onInfoClick={setSelectedMovie}
                    />
                  ))}
                </div>
              </section>
            )}

            {movies.length === 0 && tvShows.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-white">Movies</h2>
                <p className="text-sm text-white/50">No saved movies yet.</p>
              </section>
            )}

            {tvShows.length === 0 && movies.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-white">TV Shows</h2>
                <p className="text-sm text-white/50">No saved TV shows yet.</p>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg text-white/60">Your watch list is empty</p>
            <p className="mt-2 text-sm text-white/40">
              Browse movies and TV shows to add them here
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
