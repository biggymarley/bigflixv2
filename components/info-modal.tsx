"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, X, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Movie, MovieDetails, Episode, Video } from "@/lib/types";
import { backdropUrl, imageUrl } from "@/lib/tmdb";

interface InfoModalProps {
  movie: Movie | null;
  open: boolean;
  onClose: () => void;
}

export default function InfoModal({ movie, open, onClose }: InfoModalProps) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [season, setSeason] = useState(1);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(true);

  const type = movie?.media_type || "movie";

  // Fetch details + trailer + similar
  useEffect(() => {
    if (!movie || !open) return;
    setDetails(null);
    setTrailer(null);
    setSimilar([]);
    setEpisodes([]);
    setSeason(1);
    setLoading(true);

    const base = type === "tv" ? "tv" : "movie";

    Promise.all([
      fetch(`/api/tmdb/${base}/${movie.id}`).then((r) => r.json()),
      fetch(`/api/tmdb/${base}/${movie.id}/videos`).then((r) => r.json()),
      fetch(`/api/tmdb/${base}/${movie.id}/similar`).then((r) => r.json()),
    ])
      .then(([detailsData, videosData, similarData]) => {
        setDetails(detailsData);
        const trailerVideo = (videosData.results as Video[])?.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        );
        setTrailer(trailerVideo?.key || null);
        setSimilar((similarData.results || []).slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [movie, open, type]);

  // Fetch episodes for TV
  useEffect(() => {
    if (!movie || type !== "tv" || !open) return;
    fetch(`/api/tmdb/tv/${movie.id}/season/${season}`)
      .then((r) => r.json())
      .then((data) => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]));
  }, [movie, type, season, open]);

  if (!movie) return null;

  const title =
    details?.title || details?.name || movie.title || movie.name || "Untitled";
  const year = (
    details?.release_date ||
    details?.first_air_date ||
    movie.release_date ||
    movie.first_air_date
  )?.split("-")[0] || "";
  const votePercent = Math.round(
    (details?.vote_average || movie.vote_average || 0) * 10
  );
  const isNew =
    year === String(new Date().getFullYear()) ||
    year === String(new Date().getFullYear() - 1);
  const watchUrl =
    type === "tv" ? `/watch/${movie.id}?type=tv` : `/watch/${movie.id}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] max-w-3xl overflow-y-auto border-0 bg-[#181818] p-0 text-white scrollbar-hide">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* ── Hero: Trailer or Backdrop ── */}
        <div className="relative w-full">
          <div className="relative aspect-video w-full overflow-hidden">
            {trailer ? (
              <iframe
                src={`https://www.youtube.com/embed/${trailer}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&rel=0&loop=1&playlist=${trailer}`}
                className="pointer-events-none absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <Image
                src={backdropUrl(details?.backdrop_path || movie.backdrop_path)}
                alt={title}
                fill
                className="object-cover"
              />
            )}

            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#181818] via-transparent to-black/30" />
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 z-20 rounded-full bg-[#181818]/80 text-white hover:bg-[#181818]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Overlay info pinned to bottom of the aspect-video area */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between px-6 pb-6">
            <div>
              <h2 className="text-3xl font-extrabold drop-shadow-lg">
                {title}
              </h2>
              <span
                className="mt-1 inline-block text-sm font-semibold"
                style={{ color: type === "tv" ? "#46d369" : "#e50914" }}
              >
                {type === "tv" ? "Series" : "Movie"}
              </span>
              <div className="mt-3">
                <Button asChild size="default" className="pointer-events-auto gap-2 bg-white text-black font-bold hover:bg-white/90 px-6">
                  <Link href={watchUrl}>
                    <Play className="h-5 w-5 fill-black" />
                    PLAY
                  </Link>
                </Button>
              </div>
            </div>

            {/* Volume toggle */}
            {trailer && (
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-auto rounded-full border border-white/40 text-white hover:bg-white/10"
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ── Details ── */}
        <div className="space-y-5 px-6 pb-8">
          {loading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {/* Meta row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  {isNew && (
                    <span className="font-bold text-[#46d369]">NEW</span>
                  )}
                  {year && (
                    <span className="font-semibold text-white">{year}</span>
                  )}
                  {details?.number_of_seasons && (
                    <span className="text-white/70">
                      {details.number_of_seasons} Season
                      {details.number_of_seasons > 1 ? "s" : ""}
                    </span>
                  )}
                  {details?.runtime && (
                    <span className="text-white/70">
                      {Math.floor(details.runtime / 60)}h{" "}
                      {details.runtime % 60}m
                    </span>
                  )}
                </div>
                <div className="text-right text-sm">
                  <span className="text-white/50">Votes:</span>
                  <br />
                  <span className="font-bold text-[#46d369]">
                    {votePercent}%
                  </span>
                </div>
              </div>

              {/* Overview */}
              <p className="text-sm leading-relaxed text-white/80">
                {details?.overview || movie.overview}
              </p>

              {/* ── TV: Episodes ── */}
              {type === "tv" && details?.seasons && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Episodes</h3>
                    <div className="relative">
                      <select
                        value={season}
                        onChange={(e) => setSeason(Number(e.target.value))}
                        className="appearance-none rounded-md border border-white/30 bg-[#242424] px-4 py-2 pr-10 text-sm font-semibold text-white"
                      >
                        {details.seasons
                          ?.filter((s) => s.season_number > 0)
                          .map((s) => (
                            <option
                              key={s.season_number}
                              value={s.season_number}
                            >
                              Season {s.season_number}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                    </div>
                  </div>

                  <div className="space-y-0">
                    {episodes.length > 0
                      ? episodes.map((ep) => (
                          <div key={ep.episode_number}>
                            <Separator className="bg-white/10" />
                            <Link
                              href={`/watch/${movie.id}?type=tv&se=${season}&ep=${ep.episode_number}`}
                              className="flex gap-4 py-4 rounded-md transition-colors hover:bg-white/5"
                            >
                              <span className="flex w-8 shrink-0 items-center justify-center text-2xl font-bold text-white/50">
                                {ep.episode_number}
                              </span>
                              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={imageUrl(ep.still_path, "w300")}
                                  alt={ep.name}
                                  fill
                                  className="object-cover"
                                  sizes="128px"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
                                  <Play className="h-8 w-8 fill-white text-white" />
                                </div>
                              </div>
                              <div className="flex flex-1 flex-col justify-center">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white">
                                    {ep.name}
                                  </h4>
                                  {ep.runtime && (
                                    <span className="shrink-0 text-sm text-white/50">
                                      {ep.runtime}m
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">
                                  {ep.overview}
                                </p>
                              </div>
                            </Link>
                          </div>
                        ))
                      : Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex gap-4 py-4">
                            <Skeleton className="h-6 w-8" />
                            <Skeleton className="aspect-video w-32 rounded-md" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-full" />
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              )}

              {/* ── Movie: Similar Movies ── */}
              {type === "movie" && similar.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xl font-bold text-white">
                    Similar Movies:
                  </h3>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {similar.map((m) => (
                      <SimilarCard key={m.id} movie={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* TV: Similar Series */}
              {type === "tv" && similar.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-xl font-bold text-white">
                    Similar Series:
                  </h3>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {similar.map((m) => (
                      <SimilarCard key={m.id} movie={m} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SimilarCard({ movie }: { movie: Movie }) {
  const title = movie.title || movie.name || "Untitled";
  return (
    <div className="overflow-hidden rounded-md">
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={imageUrl(movie.poster_path)}
          alt={title}
          fill
          className="object-cover"
          sizes="150px"
        />
      </div>
    </div>
  );
}
