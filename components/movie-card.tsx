"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import type { Movie } from "@/lib/types";
import { imageUrl } from "@/lib/tmdb";

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

  if (type === "person") {
    return <PersonCard movie={movie} />;
  }

  return (
    <button
      onClick={() => onInfoClick?.({ ...movie, media_type: type })}
      className="group relative w-full cursor-pointer overflow-hidden rounded-md text-left transition-transform duration-300 hover:z-10 hover:scale-105"
    >
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={imageUrl(movie.poster_path)}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
        />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

function PersonCard({ movie }: { movie: Movie }) {
  return (
    <div className="overflow-hidden rounded-md">
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={imageUrl(movie.profile_path || movie.poster_path)}
          alt={movie.name || "Person"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
        />
      </div>
      <div className="bg-card p-2">
        <h3 className="line-clamp-1 text-sm font-semibold text-white">
          {movie.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {movie.known_for_department || "Actor"}
        </p>
      </div>
    </div>
  );
}
