"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import type { Movie } from "@/lib/types";
import { imageUrl, isImageMissing } from "@/lib/tmdb";

interface MovieCardProps {
  movie: Movie;
  mediaType?: "movie" | "tv";
  onInfoClick?: (movie: Movie) => void;
}

export default function MovieCard({
  movie,
  mediaType,
  onInfoClick,
}: MovieCardProps) {
  const type = mediaType || movie.media_type || "movie";
  const title = movie.title || movie.name || movie.original_title || "Untitled";
  const year =
    (movie.release_date || movie.first_air_date)?.split("-")[0] || "";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "";
  const missingPoster = isImageMissing(movie.poster_path);

  if (type === "person") {
    return <PersonCard movie={movie} onInfoClick={onInfoClick} />;
  }

  return (
    <button
      type="button"
      onClick={() => onInfoClick?.({ ...movie, media_type: type })}
      className="group/card relative w-full text-left"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover/card:-translate-y-1 group-hover/card:ring-2 group-hover/card:ring-primary/60 group-hover/card:shadow-2xl group-hover/card:shadow-primary/25">
        {missingPoster ? (
          <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
        ) : (
          <Image
            src={imageUrl(movie.poster_path)}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          />
        )}
        {missingPoster && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-3 text-center text-xs font-semibold text-white">
            Image not available
          </div>
        )}

        {/* hover veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

        {/* date (hover) */}
        {year && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover/card:opacity-100">
            {year}
          </span>
        )}

        {/* rating (hover) */}
        {rating && (
          <span className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300 opacity-0 backdrop-blur transition-opacity duration-300 group-hover/card:opacity-100">
            <Star className="h-3 w-3 fill-amber-300" />
            {rating}
          </span>
        )}

        {/* title (hover) */}
        <div className="absolute inset-x-0 bottom-0 translate-y-1 p-2.5 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
          <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">
            {title}
          </p>
        </div>
      </div>
    </button>
  );
}

function PersonCard({
  movie,
  onInfoClick,
}: {
  movie: Movie;
  onInfoClick?: (movie: Movie) => void;
}) {
  const missingProfile = isImageMissing(movie.profile_path || movie.poster_path);

  return (
    <button
      type="button"
      onClick={() => onInfoClick?.({ ...movie, media_type: "person" })}
      className="w-full overflow-hidden rounded-md text-left transition-transform duration-300 hover:z-10 hover:scale-105"
    >
      <div className="relative aspect-2/3 w-full">
        {missingProfile ? (
          <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
        ) : (
          <Image
            src={imageUrl(movie.profile_path || movie.poster_path)}
            alt={movie.name || "Person"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          />
        )}
        {missingProfile && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-3 text-center text-xs font-semibold text-white">
            Image not available
          </div>
        )}
      </div>
      <div className="bg-card p-2">
        <h3 className="line-clamp-1 text-sm font-semibold text-white">
          {movie.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {movie.known_for_department || "Actor"}
        </p>
      </div>
    </button>
  );
}
