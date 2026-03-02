import { notFound } from "next/navigation";
import Header from "@/components/header";
import CategoryResults from "@/components/category-results";
import { tmdbFetch } from "@/lib/tmdb";
import { DISCOVER_MOVIES_API, DISCOVER_SERIES_API, MOVIES_GENRES_API, SERIES_GENRES_API } from "@/lib/apis";
import type { Genre } from "@/lib/types";

interface CategoryPageProps {
  params: Promise<{
    type: string;
    genreId: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { type, genreId } = await params;
  const isMovies = type === "movies";
  const isSeries = type === "series";

  if (!isMovies && !isSeries) {
    notFound();
  }

  const genresEndpoint = isMovies ? MOVIES_GENRES_API : SERIES_GENRES_API;
  const discoverEndpoint = isMovies ? DISCOVER_MOVIES_API : DISCOVER_SERIES_API;
  const mediaType = isMovies ? "movie" : "tv";

  const genreData = await tmdbFetch<{ genres: Genre[] }>(genresEndpoint);
  const selectedGenre = genreData.genres.find((g) => String(g.id) === genreId);

  if (!selectedGenre) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24">
        <h1 className="mb-2 text-2xl font-bold text-white">{selectedGenre.name}</h1>
        <p className="mb-6 text-sm text-white/60">
          Sorted by top rated. Scroll down to load more.
        </p>

        <CategoryResults
          endpoint={discoverEndpoint}
          genreId={genreId}
          mediaType={mediaType}
        />
      </div>
    </div>
  );
}
