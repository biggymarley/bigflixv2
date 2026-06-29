"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Maximize,
  Minimize,
  ChevronDown,
  ChevronRight,
  LayoutList,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchLater } from "@/hooks/use-watch-later";
import { useWatchHistory } from "@/hooks/use-watch-history";
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
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [source, setSource] = useState<"embed" | "torrent">("embed");
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [quality, setQuality] = useState<"1080p" | "720p">("1080p");
  const [torrentLoading, setTorrentLoading] = useState(false);
  const [torrentError, setTorrentError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const returnTo = useRef("/");
  const { addItem, removeItem, isInList } = useWatchLater();
  const { addItem: addHistoryItem } = useWatchHistory();
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

  // Torrent source needs an IMDB id; YTS is movies-only.
  useEffect(() => {
    if (type !== "movie") {
      setImdbId(null);
      return;
    }
    fetch(`/api/tmdb/movie/${id}/external_ids`)
      .then((res) => res.json())
      .then((data) => setImdbId(data.imdb_id || null))
      .catch(() => setImdbId(null));
  }, [id, type]);

  useEffect(() => {
    if (type !== "tv") return;
    fetch(`/api/tmdb/tv/${id}/season/${season}`)
      .then((res) => res.json())
      .then((data) => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]));
  }, [id, type, season]);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;
    if (type !== "movie" && type !== "tv") return;

    if (type === "tv") {
      addHistoryItem({ id: numericId, type: "tv", season, episode });
      return;
    }

    addHistoryItem({ id: numericId, type: "movie" });
  }, [id, type, season, episode, addHistoryItem]);

  const availableSeasons = details?.seasons?.filter((s) => s.season_number > 0) || [];
  const currentEpisodeIndex = episodes.findIndex((ep) => ep.episode_number === episode);
  const isLastEpisodeInSeason = episodes.length > 0 && currentEpisodeIndex === episodes.length - 1;
  const currentSeasonIndex = availableSeasons.findIndex((s) => s.season_number === season);
  const hasNextSeason = currentSeasonIndex !== -1 && currentSeasonIndex < availableSeasons.length - 1;
  const isLastEpisode = isLastEpisodeInSeason && !hasNextSeason;

  const nextEpisodeInfo = type === "tv" && !isLastEpisode && episodes.length > 0
    ? isLastEpisodeInSeason
      ? { season: availableSeasons[currentSeasonIndex + 1].season_number, episode: 1, name: null, isNewSeason: true }
      : { season, episode: episode + 1, name: episodes[currentEpisodeIndex + 1]?.name || null, isNewSeason: false }
    : null;

  const goToNextEpisode = () => {
    if (!nextEpisodeInfo) return;
    setSeason(nextEpisodeInfo.season);
    setEpisode(nextEpisodeInfo.episode);
  };

  const embedBase = process.env.NEXT_PUBLIC_EMBED_BASE_URL;
  const embedUrl =
    type === "tv"
      ? `${embedBase}/embed/tv/${id}/${season}/${episode}`
      : `${embedBase}/embed/movie/${id}`;

  const torrentBase = process.env.NEXT_PUBLIC_TORRENT_BASE_URL;
  const torrentToken = process.env.NEXT_PUBLIC_TORRENT_TOKEN;
  // Torrent option is only offered for movies with a known IMDB id and a configured backend.
  const torrentAvailable = Boolean(torrentBase && type === "movie" && imdbId);
  const torrentUrl =
    torrentAvailable
      ? `${torrentBase}/stream?imdb=${imdbId}&q=${quality}&token=${torrentToken}`
      : null;

  // Reset playback state whenever the torrent stream URL changes.
  useEffect(() => {
    if (source !== "torrent") return;
    setTorrentError(false);
    setTorrentLoading(true);
  }, [source, torrentUrl]);

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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (isMobile) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setShowControls(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }
  }, [isMobile]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    if (saved) removeItem(Number(id));
    else addItem({ id: Number(id), type: type as "movie" | "tv" });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col bg-black overflow-hidden"
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchMove={handleInteraction}
    >
      {/* Top controls bar */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-linear-to-b from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 ${
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
          {torrentAvailable && (
            <div className="mr-1 flex items-center gap-1">
              {/* Source segmented toggle */}
              <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-xs">
                <button
                  onClick={() => setSource("embed")}
                  className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    source === "embed" ? "bg-white/90 text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  Server
                </button>
                <button
                  onClick={() => setSource("torrent")}
                  className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    source === "torrent" ? "bg-primary text-primary-foreground" : "text-white/70 hover:text-white"
                  }`}
                >
                  Torrent
                </button>
              </div>
              {/* Quality chips (torrent only) */}
              {source === "torrent" && (
                <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-xs">
                  {(["1080p", "720p"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`rounded-full px-2 py-1 font-medium transition-colors ${
                        quality === q ? "bg-white/90 text-black" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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

      {/* Player: native <video> for torrent source, embed iframe otherwise */}
      {source === "torrent" && torrentUrl ? (
        <>
          <video
            key={torrentUrl}
            src={torrentUrl}
            className="h-full w-full flex-1 bg-black"
            controls
            autoPlay
            playsInline
            onWaiting={() => setTorrentLoading(true)}
            onCanPlay={() => setTorrentLoading(false)}
            onPlaying={() => setTorrentLoading(false)}
            onError={() => {
              setTorrentLoading(false);
              setTorrentError(true);
            }}
          />

          {/* Buffering overlay (torrents take a moment to spin up the swarm) */}
          {torrentLoading && !torrentError && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
              <p className="text-sm text-white/80">Connecting to the swarm…</p>
              <p className="text-xs text-white/40">Torrents can take 5–30s to start</p>
            </div>
          )}

          {/* Error overlay */}
          {torrentError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
              <p className="text-sm text-white/80">
                Couldn&apos;t stream this title from torrent
                {quality === "1080p" ? " — try 720p, or" : " —"} switch back to the server.
              </p>
              <div className="flex gap-2">
                {quality === "1080p" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuality("720p")}
                  >
                    Try 720p
                  </Button>
                )}
                <Button variant="default" size="sm" onClick={() => setSource("embed")}>
                  Use server
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <iframe
            src={embedUrl}
            className="h-full w-full flex-1"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
            referrerPolicy="origin"
          />

          {/* Wake layer for iframe-heavy area: shows controls on interaction when hidden */}
          <div
            className={`absolute inset-0 z-10 ${showControls ? "pointer-events-none" : "pointer-events-auto"}`}
            onMouseMove={handleInteraction}
            onTouchStart={handleInteraction}
            onTouchMove={handleInteraction}
          />
        </>
      )}

      {/* Next Episode button */}
      {nextEpisodeInfo && (
        <div
          className={`absolute bottom-20 right-6 z-20 transition-all duration-300 ${
            showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <button
            onClick={goToNextEpisode}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/75 backdrop-blur-md px-4 py-3 text-left shadow-2xl transition-all duration-200 hover:border-primary/60 hover:bg-black/90 hover:scale-[1.02]"
          >
            <div className="w-0.5 self-stretch rounded-full bg-primary opacity-80 group-hover:opacity-100" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 group-hover:text-primary">
                {nextEpisodeInfo.isNewSeason ? `Season ${nextEpisodeInfo.season}` : "Next Episode"}
              </span>
              <span className="text-sm font-medium text-white/90 group-hover:text-white">
                {nextEpisodeInfo.isNewSeason
                  ? "Episode 1"
                  : `E${nextEpisodeInfo.episode}${nextEpisodeInfo.name ? ` · ${nextEpisodeInfo.name}` : ""}`}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white/80" />
          </button>
        </div>
      )}

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
