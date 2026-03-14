"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Maximize,
  Minimize,
  ChevronDown,
  LayoutList,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const returnTo = useRef("/");
  const { addItem, removeItem, isInList } = useWatchLater();
  const saved = isInList(Number(id));

  useEffect(() => {
    returnTo.current = sessionStorage.getItem("preWatchPath") || "/";
  }, []);

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
      className="relative flex h-screen w-full flex-col bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Top controls bar */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => router.push(returnTo.current)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          {type === "tv" && details?.seasons && (
            <Button
              variant="ghost"
              size="icon"
              className={`text-white hover:bg-white/10 ${sidebarOpen ? "bg-white/20" : ""}`}
              onClick={() => setSidebarOpen((o) => !o)}
              title="Episodes"
            >
              <LayoutList className="h-5 w-5" />
            </Button>
          )}
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

      {/* Video iframe */}
      <iframe
        src={embedUrl}
        className="h-full w-full flex-1"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        referrerPolicy="origin"
      />

      {/* Episodes sidebar — slides in from the right, sits above the iframe */}
      {type === "tv" && details?.seasons && (
        <div
          className={`absolute top-0 right-0 z-20 h-full w-72 flex flex-col bg-black/95 backdrop-blur-sm border-l border-white/10 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pt-14">
            <span className="text-sm font-semibold text-white">Episodes</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Season selector */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="relative">
              <select
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value));
                  setEpisode(1);
                }}
                className="w-full appearance-none rounded-md border border-white/20 bg-white/5 px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-white/40"
              >
                {details.seasons
                  ?.filter((s) => s.season_number > 0)
                  .map((s) => (
                    <option key={s.season_number} value={s.season_number} className="bg-zinc-900">
                      Season {s.season_number}
                    </option>
                  ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            </div>
          </div>

          {/* Episode list — scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {episodes.length > 0
              ? episodes.map((ep) => (
                  <button
                    key={ep.episode_number}
                    onClick={() => setEpisode(ep.episode_number)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      episode === ep.episode_number
                        ? "bg-primary text-primary-foreground"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={`text-xs font-bold shrink-0 w-8 ${episode === ep.episode_number ? "text-primary-foreground/70" : "text-white/40"}`}>
                      E{ep.episode_number}
                    </span>
                    <span className="text-sm leading-snug line-clamp-2">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </span>
                  </button>
                ))
              : Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
