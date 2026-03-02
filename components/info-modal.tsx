"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, X, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type {
  Movie,
  MovieDetails,
  Episode,
  Video,
  PersonCredit,
  PersonDetails,
} from "@/lib/types";
import { backdropUrl, imageUrl, isImageMissing } from "@/lib/tmdb";

interface InfoModalProps {
  movie: Movie | null;
  open: boolean;
  onClose: () => void;
}

export default function InfoModal({ movie, open, onClose }: InfoModalProps) {
  const [activeMovie, setActiveMovie] = useState<Movie | null>(movie);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  const [personCredits, setPersonCredits] = useState<PersonCredit[]>([]);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [season, setSeason] = useState(1);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(true);

  const type = (activeMovie?.media_type || "movie") as "movie" | "tv" | "person";

  useEffect(() => {
    setActiveMovie(movie);
  }, [movie]);

  // Fetch details + trailer + similar
  useEffect(() => {
    if (!activeMovie || !open) return;
    setDetails(null);
    setPersonDetails(null);
    setPersonCredits([]);
    setTrailer(null);
    setSimilar([]);
    setEpisodes([]);
    setSeason(1);
    setLoading(true);

    if (type === "person") {
      fetch(`/api/tmdb/person/${activeMovie.id}?append_to_response=combined_credits`)
        .then((r) => r.json())
        .then((personData: PersonDetails) => {
          setPersonDetails(personData);

          const credits = [
            ...(personData.combined_credits?.cast || []),
            ...(personData.combined_credits?.crew || []),
          ].filter((credit) => credit.media_type === "movie" || credit.media_type === "tv");

          const uniqueCredits = Array.from(
            new Map(
              credits
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .map((credit) => [`${credit.media_type}-${credit.id}`, credit])
            ).values()
          );

          setPersonCredits(uniqueCredits);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    const base = type === "tv" ? "tv" : "movie";

    Promise.all([
      fetch(`/api/tmdb/${base}/${activeMovie.id}`).then((r) => r.json()),
      fetch(`/api/tmdb/${base}/${activeMovie.id}/videos`).then((r) => r.json()),
      fetch(`/api/tmdb/${base}/${activeMovie.id}/similar`).then((r) => r.json()),
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
  }, [activeMovie, open, type]);

  // Fetch episodes for TV
  useEffect(() => {
    if (!activeMovie || type !== "tv" || !open) return;
    fetch(`/api/tmdb/tv/${activeMovie.id}/season/${season}`)
      .then((r) => r.json())
      .then((data) => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]));
  }, [activeMovie, type, season, open]);

  if (!activeMovie) return null;

  if (type === "person") {
    const personName = personDetails?.name || activeMovie.name || "Unknown person";
    const personBio =
      personDetails?.biography?.trim() ||
      "No biography is available for this person yet.";
    const personImagePath =
      personDetails?.profile_path || activeMovie.profile_path || activeMovie.poster_path;
    const missingPersonImage = isImageMissing(personImagePath);

    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] max-w-3xl lg:max-w-4xl xl:max-w-5xl overflow-y-auto border-0 bg-[#181818] p-0 text-white scrollbar-hide"
        >
          <DialogTitle className="sr-only">{personName}</DialogTitle>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-20 rounded-full bg-[#181818]/80 text-white hover:bg-[#181818]"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative aspect-video w-full overflow-hidden">
              {missingPersonImage ? (
                <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
              ) : (
                <Image
                  src={imageUrl(personImagePath)}
                  alt={personName}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-[#181818] via-[#181818]/45 to-black/10" />
              {missingPersonImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-3 text-center text-sm font-semibold text-white">
                  Image not available
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-3xl font-extrabold drop-shadow-lg">{personName}</h2>
                <p className="mt-1 text-sm text-white/75">
                  {personDetails?.known_for_department ||
                    activeMovie.known_for_department ||
                    "Performer"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 pb-8 pt-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div className="grid gap-2 text-sm text-white/80 sm:grid-cols-2">
                  {personDetails?.birthday && <p>Born: {personDetails.birthday}</p>}
                  {personDetails?.place_of_birth && (
                    <p>From: {personDetails.place_of_birth}</p>
                  )}
                  {personDetails?.deathday && <p>Died: {personDetails.deathday}</p>}
                  {personDetails?.also_known_as?.[0] && (
                    <p>Also known as: {personDetails.also_known_as[0]}</p>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-white/80">{personBio}</p>

                <div className="space-y-3 pt-1">
                  <h3 className="text-xl font-bold text-white">Known for</h3>
                  {personCredits.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {personCredits.map((credit) => (
                        <PersonCreditCard
                          key={`${credit.media_type}-${credit.id}`}
                          credit={credit}
                          onSelect={(selected) =>
                            setActiveMovie({
                              id: selected.id,
                              media_type: selected.media_type,
                              title: selected.title,
                              name: selected.name,
                              overview: selected.overview || "",
                              poster_path: selected.poster_path,
                              backdrop_path: selected.backdrop_path || null,
                              vote_average: selected.vote_average || 0,
                              vote_count: 0,
                              popularity: selected.popularity || 0,
                              release_date: selected.release_date,
                              first_air_date: selected.first_air_date,
                            })
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">
                      No movie or TV credits were found.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const title =
    details?.title || details?.name || activeMovie.title || activeMovie.name || "Untitled";
  const year = (
    details?.release_date ||
    details?.first_air_date ||
    activeMovie.release_date ||
    activeMovie.first_air_date
  )?.split("-")[0] || "";
  const votePercent = Math.round(
    (details?.vote_average || activeMovie.vote_average || 0) * 10
  );
  const isNew =
    year === String(new Date().getFullYear()) ||
    year === String(new Date().getFullYear() - 1);
  const watchUrl =
    type === "tv" ? `/watch/${activeMovie.id}?type=tv` : `/watch/${activeMovie.id}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] max-w-3xl lg:max-w-4xl xl:max-w-5xl overflow-y-auto border-0 bg-[#181818] p-0 text-white scrollbar-hide">
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
                src={backdropUrl(details?.backdrop_path || activeMovie.backdrop_path)}
                alt={title}
                fill
                className="object-cover"
              />
            )}

            <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-[#181818] via-transparent to-black/30" />
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
                {details?.overview || activeMovie.overview}
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
                              href={`/watch/${activeMovie.id}?type=tv&se=${season}&ep=${ep.episode_number}`}
                              className="flex gap-4 py-4 rounded-md transition-colors hover:bg-white/5"
                            >
                              <span className="flex w-8 shrink-0 items-center justify-center text-2xl font-bold text-white/50">
                                {ep.episode_number}
                              </span>
                              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md">
                                {isImageMissing(ep.still_path) ? (
                                  <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[80px_auto]" />
                                ) : (
                                  <Image
                                    src={imageUrl(ep.still_path, "w300")}
                                    alt={ep.name}
                                    fill
                                    className="object-cover"
                                    sizes="128px"
                                  />
                                )}
                                {isImageMissing(ep.still_path) && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-2 text-center text-[10px] font-semibold text-white">
                                    Image not available
                                  </div>
                                )}
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
                      <SimilarCard
                        key={m.id}
                        movie={m}
                        mediaType="movie"
                        onSelect={setActiveMovie}
                      />
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
                      <SimilarCard
                        key={m.id}
                        movie={m}
                        mediaType="tv"
                        onSelect={setActiveMovie}
                      />
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

function SimilarCard({
  movie,
  mediaType,
  onSelect,
}: {
  movie: Movie;
  mediaType: "movie" | "tv";
  onSelect: (movie: Movie) => void;
}) {
  const title = movie.title || movie.name || "Untitled";
  const missingPoster = isImageMissing(movie.poster_path);

  return (
    <button
      type="button"
      onClick={() => onSelect({ ...movie, media_type: mediaType })}
      className="group block overflow-hidden rounded-md transition-transform duration-200 hover:scale-[1.03]"
    >
      <div className="relative aspect-2/3 w-full">
        {missingPoster ? (
          <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
        ) : (
          <Image
            src={imageUrl(movie.poster_path)}
            alt={title}
            fill
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="150px"
          />
        )}
        {missingPoster && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-2 text-center text-[10px] font-semibold text-white">
            Image not available
          </div>
        )}
      </div>
    </button>
  );
}

function PersonCreditCard({
  credit,
  onSelect,
}: {
  credit: PersonCredit;
  onSelect: (credit: PersonCredit) => void;
}) {
  const title = credit.title || credit.name || "Untitled";
  const subtitle = credit.character || credit.job;
  const missingPoster = isImageMissing(credit.poster_path);

  return (
    <button
      type="button"
      onClick={() => onSelect(credit)}
      className="group block overflow-hidden rounded-md text-left transition-transform duration-200 hover:scale-[1.03]"
    >
      <div className="relative aspect-2/3 w-full">
        {missingPoster ? (
          <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
        ) : (
          <Image
            src={imageUrl(credit.poster_path)}
            alt={title}
            fill
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="150px"
          />
        )}
        {missingPoster && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-2 text-center text-[10px] font-semibold text-white">
            Image not available
          </div>
        )}
      </div>
      <div className="space-y-0.5 px-1 py-2">
        <p className="line-clamp-1 text-xs font-semibold text-white">{title}</p>
        <p className="line-clamp-1 text-[11px] text-white/60">
          {subtitle || credit.media_type.toUpperCase()}
        </p>
      </div>
    </button>
  );
}
