import { tmdbFetch } from "@/lib/tmdb";
import {
  NOW_PLAYING_MOVIES_API,
  TOP_RATED_MOVIES_API,
  POPULAR_MOVIES_API,
  DISCOVER_MOVIES_API,
  MOVIES_GENRES_API,
} from "@/lib/apis";
import type { Genre, Movie, SliderMode, TMDBResponse, Video } from "@/lib/types";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import DiscoverContent from "@/components/discover-content";

export default async function DiscoverMoviesPage() {
  const [nowPlayingData, genresData] = await Promise.all([
    tmdbFetch<TMDBResponse<Movie>>(NOW_PLAYING_MOVIES_API),
    tmdbFetch<{ genres: Genre[] }>(MOVIES_GENRES_API),
  ]);

  const featuredMovie = nowPlayingData.results[0];
  const genres = genresData.genres;

  const videosData = await tmdbFetch<{ results: Video[] }>(
    `movie/${featuredMovie.id}/videos`
  );
  const trailerKey =
    videosData.results?.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    )?.key || null;

  const baseModes: SliderMode[] = [
    { id: "Cinema", label: "Playing Now in Cinemas", api: NOW_PLAYING_MOVIES_API, type: "movie" },
    { id: "TopRated", label: "Top Rated Movies", api: TOP_RATED_MOVIES_API, type: "movie" },
    { id: "Popular", label: "Popular Movies", api: POPULAR_MOVIES_API, type: "movie" },
  ];

  const genreModes: SliderMode[] = genres.map((g) => ({
    id: `genre-${g.id}`,
    label: g.name,
    api: DISCOVER_MOVIES_API,
    params: { with_genres: String(g.id) },
    type: "movie",
  }));

  const allModes = [...baseModes, ...genreModes];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <HeroSection movie={featuredMovie} mediaType="movie" trailerKey={trailerKey} />
      <div className="mx-auto  px-4 pt-8">
        <DiscoverContent modes={allModes} />
      </div>
    </div>
  );
}
