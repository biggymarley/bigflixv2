"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Compass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import MovieCard from "@/components/movie-card";
import InfoModal from "@/components/info-modal";
import { useWatchLater } from "@/hooks/use-watch-later";
import type { Movie, MovieDetails } from "@/lib/types";

type SavedTitle = MovieDetails & { savedType: "movie" | "tv" };
type Tab = "all" | "movie" | "tv";

export default function WatchLaterPage() {
  const { items } = useWatchLater();
  const [savedTitles, setSavedTitles] = useState<SavedTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [tab, setTab] = useState<Tab>("all");

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

  const movieCount = useMemo(
    () => savedTitles.filter((t) => t.savedType === "movie").length,
    [savedTitles]
  );
  const showCount = savedTitles.length - movieCount;

  const visible = savedTitles.filter((t) =>
    tab === "all" ? true : t.savedType === tab
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: savedTitles.length },
    { key: "movie", label: "Movies", count: movieCount },
    { key: "tv", label: "Shows", count: showCount },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Watch Later
            </h1>
            <p className="mt-0.5 text-sm text-white/50">
              {savedTitles.length > 0
                ? `${savedTitles.length} ${
                    savedTitles.length === 1 ? "title" : "titles"
                  } saved`
                : "Your saved titles, ready when you are"}
            </p>
          </div>

          {savedTitles.length > 0 && (
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                    tab === t.key
                      ? "bg-primary text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t.label}
                  <span
                    className={`text-xs ${
                      tab === t.key ? "text-white/80" : "text-white/35"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 w-full rounded-xl" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visible.map((title) => (
              <MovieCard
                key={`${title.savedType}-${title.id}`}
                movie={title}
                mediaType={title.savedType}
                onInfoClick={setSelectedMovie}
              />
            ))}
          </div>
        ) : savedTitles.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-white/50">
            <p className="text-base">No {tab === "movie" ? "movies" : "shows"} in your list yet.</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-20 text-center">
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Bookmark className="h-7 w-7" />
            </span>
            <h2 className="text-xl font-bold text-white">Your watch list is empty</h2>
            <p className="mt-2 text-sm text-white/50">
              Tap the bookmark on any movie or show to save it here for later.
            </p>
            <Button asChild className="mt-6">
              <Link href="/discover/movies">
                <Compass className="mr-2 h-4 w-4" />
                Browse titles
              </Link>
            </Button>
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
