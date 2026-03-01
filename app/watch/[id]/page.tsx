"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Maximize,
  Minimize,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchLater } from "@/hooks/use-watch-later";
import type { Episode, MovieDetails } from "@/lib/types";

export default function WatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const type = searchParams.get("type") || "movie";

  const initialSeason = Number(searchParams.get("se")) || 1;
  const initialEpisode = Number(searchParams.get("ep")) || 1;

  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { addItem, removeItem, isInList } = useWatchLater();
  const saved = isInList(Number(id));

  useEffect(() => {
    const endpoint = type === "tv" ? `tv/${id}` : `movie/${id}`;
    fetch(`/api/tmdb/${endpoint}`)
      .then((res) => res.json())
      .then(setDetails)
      .catch(() => {});
  }, [id, type]);

  useEffect(() => {
    if (type !== "tv") return;
    fetch(`/api/tmdb/tv/${id}/season/${season}`)
      .then((res) => res.json())
      .then((data) => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]));
  }, [id, type, season]);

  const embedUrl =
    type === "tv"
      ? `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.xyz/embed/movie/${id}`;

  const title = details?.title || details?.name || "Loading...";

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  const handleSave = () => {
    if (saved) removeItem(Number(id));
    else addItem({ id: Number(id), type: type as "movie" | "tv" });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col bg-black"
      onMouseMove={handleMouseMove}
    >
      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={handleSave}
          >
            <Bookmark
              className={`h-5 w-5 ${saved ? "fill-primary text-primary" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <iframe
        src={embedUrl}
        className="h-full w-full flex-1"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        referrerPolicy="origin"
      />

      {type === "tv" && details?.seasons && (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-4 py-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value));
                  setEpisode(1);
                }}
                className="appearance-none rounded-md border border-white/20 bg-black/80 px-3 py-1.5 pr-8 text-sm text-white"
              >
                {details.seasons
                  ?.filter((s) => s.season_number > 0)
                  .map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      Season {s.season_number}
                    </option>
                  ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {episodes.length > 0
                ? episodes.map((ep) => (
                    <Button
                      key={ep.episode_number}
                      size="sm"
                      variant={
                        episode === ep.episode_number ? "default" : "secondary"
                      }
                      className="h-8 min-w-[3rem] text-xs"
                      onClick={() => setEpisode(ep.episode_number)}
                    >
                      E{ep.episode_number}
                    </Button>
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-12 rounded-md" />
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
