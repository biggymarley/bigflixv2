import { tmdbFetch } from "@/lib/tmdb";
import {
  ON_THE_AIR_API,
  TOP_RATED_TV_API,
  POPULAR_SERIES_API,
  DISCOVER_SERIES_API,
  SERIES_GENRES_API,
} from "@/lib/apis";
import type { Genre, Movie, SliderMode, TMDBResponse } from "@/lib/types";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import DiscoverContent from "@/components/discover-content";

export default async function DiscoverSeriesPage() {
  const [onAirData, genresData] = await Promise.all([
    tmdbFetch<TMDBResponse<Movie>>(ON_THE_AIR_API),
    tmdbFetch<{ genres: Genre[] }>(SERIES_GENRES_API),
  ]);

  const featuredShow = onAirData.results[0];
  const genres = genresData.genres;

  const baseModes: SliderMode[] = [
    { id: "OnAir", label: "On The Air Today", api: ON_THE_AIR_API, type: "tv" },
    { id: "TopRated", label: "Top Rated Series", api: TOP_RATED_TV_API, type: "tv" },
    { id: "Popular", label: "Popular Series", api: POPULAR_SERIES_API, type: "tv" },
  ];

  const genreModes: SliderMode[] = genres.map((g) => ({
    id: `genre-${g.id}`,
    label: g.name,
    api: DISCOVER_SERIES_API,
    params: { with_genres: String(g.id) },
    type: "tv",
  }));

  const allModes = [...baseModes, ...genreModes];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <HeroSection movie={featuredShow} mediaType="tv" />
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <DiscoverContent modes={allModes} />
      </div>
    </div>
  );
}
