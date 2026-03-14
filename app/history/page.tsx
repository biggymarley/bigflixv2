"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/header";
import { useWatchHistory } from "@/hooks/use-watch-history";
import { imageUrl } from "@/lib/tmdb";
import type { MovieDetails } from "@/lib/types";

type HistoryTitle = MovieDetails & {
  historyType: "movie" | "tv";
  watchedAt: number;
  season?: number;
  episode?: number;
};

export default function HistoryPage() {
  const router = useRouter();
  const { items, clearHistory } = useWatchHistory();
  const [historyTitles, setHistoryTitles] = useState<HistoryTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setHistoryTitles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      items.map((item) =>
        fetch(`/api/tmdb/${item.type === "tv" ? "tv" : "movie"}/${item.id}`).then((res) =>
          res.json()
        )
      )
    )
      .then((results) => {
        const normalized = results
          .filter(Boolean)
          .map((result, index) => ({
            ...result,
            historyType: items[index]?.type || "movie",
            watchedAt: items[index]?.watchedAt || Date.now(),
            season: items[index]?.season,
            episode: items[index]?.episode,
          })) as HistoryTitle[];

        setHistoryTitles(normalized);
      })
      .catch(() => setHistoryTitles([]))
      .finally(() => setLoading(false));
  }, [items]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Watch History</h1>
            <p className="mt-1 text-sm text-white/50">
              Recently watched titles saved in your browser cookies.
            </p>
          </div>
          {historyTitles.length > 0 && (
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={clearHistory}
            >
              Clear History
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
                <Skeleton className="h-20 w-14 shrink-0 rounded-md" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : historyTitles.length > 0 ? (
          <div className="space-y-3">
            {historyTitles.map((title) => {
              const name = title.title || title.name || "Untitled";
              const type = title.historyType;
              const watchHref =
                type === "tv"
                  ? `/watch/${title.id}?type=tv&se=${title.season || 1}&ep=${title.episode || 1}`
                  : `/watch/${title.id}?type=movie`;

              return (
                <div
                  key={`${type}-${title.id}`}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/2 p-3"
                >
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-black/40">
                    <Image
                      src={imageUrl(title.poster_path)}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85">
                        {type === "tv" ? "TV Show" : "Movie"}
                      </span>
                      {type === "tv" && (
                        <span className="text-xs text-white/60">
                          S{title.season || 1} E{title.episode || 1}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      Watched {new Date(title.watchedAt).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => router.push(watchHref)}
                  >
                    Continue
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg text-white/60">No watch history yet</p>
            <p className="mt-2 text-sm text-white/40">
              Start watching a movie or TV show and it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
