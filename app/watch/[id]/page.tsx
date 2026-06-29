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
  Layers,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchLater } from "@/hooks/use-watch-later";
import { useWatchHistory } from "@/hooks/use-watch-history";
import type { Episode, MovieDetails } from "@/lib/types";
import { listTorrents, type TorrentPick } from "@/lib/torrent";

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
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [torrentInfo, setTorrentInfo] = useState<TorrentPick | null>(null);
  const [torrentOptions, setTorrentOptions] = useState<TorrentPick[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
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
  // Seeder health colour: green = plenty, amber = thin, red = risky.
  const seedColor = (n: number) =>
    n >= 50 ? "text-green-400" : n >= 10 ? "text-amber-400" : "text-red-400";

  const buildTorrentUrl = useCallback(
    (pick: TorrentPick) =>
      `${torrentBase}/stream?hash=${pick.hash}&fileIdx=${pick.fileIdx ?? ""}&codec=${pick.codec}&token=${torrentToken}`,
    [torrentBase, torrentToken]
  );

  // Switch to a specific torrent (e.g. user picked another source).
  const selectTorrent = useCallback(
    (pick: TorrentPick) => {
      setTorrentError(false);
      setTorrentLoading(true);
      setTorrentInfo(pick);
      setVideoSrc(buildTorrentUrl(pick));
      setSourcesOpen(false);
    },
    [buildTorrentUrl]
  );

  // Resolve candidates in the browser (residential IP → Torrentio works), then
  // hand only the infohash to the box. Falls back to the box's own ?imdb=
  // resolver (YTS) if Torrentio is unreachable from the client.
  useEffect(() => {
    if (source !== "torrent" || !torrentAvailable || !imdbId) return;
    let cancelled = false;
    const ctrl = new AbortController();
    setTorrentError(false);
    setTorrentLoading(true);
    setVideoSrc(null);
    setTorrentInfo(null);
    setTorrentOptions([]);

    (async () => {
      const list = await listTorrents(imdbId, quality, ctrl.signal);
      if (cancelled) return;
      setTorrentOptions(list);
      if (list.length) {
        setTorrentInfo(list[0]);
        setVideoSrc(buildTorrentUrl(list[0]));
      } else {
        // Torrentio unreachable → let the box try via YTS.
        setVideoSrc(`${torrentBase}/stream?imdb=${imdbId}&q=${quality}&token=${torrentToken}`);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [source, torrentAvailable, imdbId, quality, torrentBase, torrentToken, buildTorrentUrl]);

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
              {/* Seeder health badge */}
              {source === "torrent" && torrentInfo && (
                <span
                  className={`flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold ${seedColor(
                    torrentInfo.seeds
                  )}`}
                  title={`${torrentInfo.seeds} seeders · ${torrentInfo.quality} · ${torrentInfo.codec}`}
                >
                  <Users className="h-3 w-3" />
                  {torrentInfo.seeds}
                </span>
              )}
              {/* Source picker toggle */}
              {source === "torrent" && torrentOptions.length > 1 && (
                <button
                  onClick={() => setSourcesOpen((o) => !o)}
                  title="Choose a different torrent"
                  className={`flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-xs font-medium transition-colors ${
                    sourcesOpen ? "bg-white/90 text-black" : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  Sources
                </button>
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
      {source === "torrent" && torrentAvailable ? (
        <>
          {videoSrc && (
            <video
              key={videoSrc}
              src={videoSrc}
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
                // Surface the picker so the user can try a different torrent.
                if (torrentOptions.length > 1) setSourcesOpen(true);
              }}
            />
          )}

          {/* Buffering overlay (resolving the source, then spinning up the swarm) */}
          {(torrentLoading || !videoSrc) && !torrentError && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
              <p className="text-sm text-white/80">
                {!videoSrc ? "Finding the best source…" : "Connecting to the swarm…"}
              </p>
              {torrentInfo ? (
                <p className={`flex items-center gap-1.5 text-xs font-medium ${seedColor(torrentInfo.seeds)}`}>
                  <Users className="h-3 w-3" />
                  {torrentInfo.seeds} seeders · {torrentInfo.quality} · {torrentInfo.codec}
                </p>
              ) : (
                <p className="text-xs text-white/40">Torrents can take 5–30s to start</p>
              )}
            </div>
          )}

          {/* Error overlay */}
          {torrentError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
              <p className="text-sm text-white/80">
                This torrent wouldn&apos;t play. Try another source
                {quality === "1080p" ? ", drop to 720p," : ""} or use the server.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {torrentOptions.length > 1 && (
                  <Button variant="secondary" size="sm" onClick={() => setSourcesOpen(true)}>
                    <Layers className="mr-1 h-4 w-4" /> Other sources
                  </Button>
                )}
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

          {/* Sources picker — slide-in list of torrent candidates */}
          {torrentOptions.length > 0 && (
            <div
              className={`absolute top-0 right-0 z-30 h-full w-80 max-w-[85vw] flex flex-col bg-black/95 backdrop-blur-sm border-l border-white/10 transition-transform duration-300 ease-in-out ${
                sourcesOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pt-14">
                <span className="text-sm font-semibold text-white">
                  Sources <span className="text-white/40">({torrentOptions.length})</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setSourcesOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {torrentOptions.map((opt) => {
                  const active = torrentInfo?.hash === opt.hash;
                  return (
                    <button
                      key={opt.hash}
                      onClick={() => selectTorrent(opt)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-primary/20 ring-1 ring-primary/50" : "hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80 uppercase">
                          {opt.quality}
                        </span>
                        <span className={opt.codec === "x264" ? "text-white/50" : "text-amber-400/80"}>
                          {opt.codec}
                        </span>
                        <span className={`ml-auto flex items-center gap-1 ${seedColor(opt.seeds)}`}>
                          <Users className="h-3 w-3" />
                          {opt.seeds}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-white/50">
                        {opt.size && <span className="text-white/40">{opt.size} · </span>}
                        {opt.title || opt.provider}
                      </p>
                    </button>
                  );
                })}
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
