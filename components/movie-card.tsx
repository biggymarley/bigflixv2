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
  const missingPoster = isImageMissing(movie.poster_path);

  if (type === "person") {
    return <PersonCard movie={movie} onInfoClick={onInfoClick} />;
  }

  return (
    <button
      onClick={() => onInfoClick?.({ ...movie, media_type: type })}
      className="group relative w-full cursor-pointer overflow-hidden rounded-md text-left transition-transform duration-300 hover:z-10 hover:scale-105"
    >
      <div className="relative aspect-2/3 w-full">
        {missingPoster ? (
          <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
        ) : (
          <Image
            src={imageUrl(movie.poster_path)}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          />
        )}
        {missingPoster && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-3 text-center text-xs font-semibold text-white">
            Image not available
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/90 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <h3 className="line-clamp-2 text-sm font-bold text-white">
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
          {year && <span>{year}</span>}
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {movie.vote_average?.toFixed(1)}
          </span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] uppercase">
            {type}
          </span>
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
