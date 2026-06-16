"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import InfoModal from "@/components/info-modal";
import MediaRow, { type RowCard } from "@/components/media-row";
import PlatformGrid from "@/components/platform-grid";
import { WATCH_REGION, type Platform } from "@/lib/platforms";
import { imageUrl } from "@/lib/tmdb";
import type { Movie, TMDBResponse } from "@/lib/types";

function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setDisplay(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-3xl font-semibold tracking-tight tabular-nums text-white md:text-4xl">
        <CountUp value={value} />
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
        <span
          className="h-1.5 w-1.5 rounded-full ring-1 ring-white/20"
          style={{ backgroundColor: color }}
        />
        {label}
      </p>
    </div>
  );
}

export default function PlatformView({ platform }: { platform: Platform }) {
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [topShows, setTopShows] = useState<Movie[]>([]);
  const [movieCount, setMovieCount] = useState(0);
  const [showCount, setShowCount] = useState(0);
  const [tab, setTab] = useState<"movie" | "tv">("movie");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const base = `watch_region=${WATCH_REGION}&with_watch_providers=${platform.providerId}&sort_by=popularity.desc&page=1`;
    Promise.all([
      fetch(`/api/tmdb/discover/movie?${base}`).then((r) => r.json()),
      fetch(`/api/tmdb/discover/tv?${base}`).then((r) => r.json()),
    ])
      .then(([m, t]: TMDBResponse<Movie>[]) => {
        setTopMovies((m.results || []).slice(0, 10));
        setTopShows((t.results || []).slice(0, 10));
        setMovieCount(m.total_results || 0);
        setShowCount(t.total_results || 0);
      })
      .catch(() => {
        setTopMovies([]);
        setTopShows([]);
      });
  }, [platform.providerId]);

  const toCards = (list: Movie[], type: "movie" | "tv"): RowCard[] =>
    list.map((item, i) => ({
      key: `${type}-${item.id}`,
      poster_path: item.poster_path,
      title: item.title || item.name || "Untitled",
      rank: i + 1,
      meta: item.vote_average ? item.vote_average.toFixed(1) : undefined,
      onClick: () => setSelectedMovie({ ...item, media_type: type }),
    }));

  const movieCards = useMemo(() => toCards(topMovies, "movie"), [topMovies]);
  const showCards = useMemo(() => toCards(topShows, "tv"), [topShows]);

  return (
    <div className="relative min-h-screen bg-black">
      {/* brand color wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem]"
        style={{
          background: `linear-gradient(to bottom, ${platform.color}55, ${platform.color}1a 38%, transparent)`,
        }}
      />

      {/* Platform hero */}
      <div className="relative px-6 pb-6 pt-28 md:px-12">
        <div className="relative flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 md:h-20 md:w-20">
            <Image
              src={imageUrl(platform.logoPath, "w300")}
              alt={platform.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
              Platform
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              {platform.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Description + live counts */}
      <div className="relative px-6 pb-10 md:px-12">
        <p className="max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
          {platform.description}
        </p>
        <div className="mt-6 flex items-center gap-7 md:gap-10">
          <Stat value={movieCount} label="Movies" color={platform.color} />
          <span className="h-10 w-px bg-white/10" />
          <Stat value={showCount} label="Shows" color={platform.color} />
        </div>
      </div>

      {/* Top 10 rows */}
      <MediaRow title={`Top 10 Movies on ${platform.name}`} cards={movieCards} />
      <MediaRow title={`Top 10 Shows on ${platform.name}`} cards={showCards} />

      {/* All titles + toggle */}
      <section className="px-6 pb-16 pt-2 md:px-12">
        <div className="mb-6 flex items-center gap-2">
          <h2 className="mr-2 text-xl font-bold tracking-tight text-white md:text-2xl">
            All titles
          </h2>
          <div className="flex rounded-full border border-white/15 bg-white/5 p-0.5">
            {(["movie", "tv"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "bg-primary text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t === "movie" ? "Movies" : "Shows"}
              </button>
            ))}
          </div>
        </div>

        <PlatformGrid
          key={tab}
          providerId={platform.providerId}
          mediaType={tab}
          onInfoClick={setSelectedMovie}
        />
      </section>

      <InfoModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}
