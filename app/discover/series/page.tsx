import { tmdbFetch } from "@/lib/tmdb";
import {
  ON_THE_AIR_API,
  TOP_RATED_TV_API,
  POPULAR_SERIES_API,
  DISCOVER_SERIES_API,
  SERIES_GENRES_API,
} from "@/lib/apis";
import type { Genre, Movie, SliderMode, TMDBResponse, Video } from "@/lib/types";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import DiscoverContent from "@/components/discover-content";

export default async function DiscoverSeriesPage() {
  const [topRatedData, genresData] = await Promise.all([
    tmdbFetch<TMDBResponse<Movie>>(TOP_RATED_TV_API),
    tmdbFetch<{ genres: Genre[] }>(SERIES_GENRES_API),
  ]);

  const featuredShow = topRatedData.results[0];
  const genres = genresData.genres;

  const videosData = await tmdbFetch<{ results: Video[] }>(
    `tv/${featuredShow.id}/videos`
  );
  const trailerKey =
    videosData.results?.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    )?.key || null;

  const baseModes: SliderMode[] = [
    { id: "TopRated", label: "Top Rated Series", api: TOP_RATED_TV_API, type: "tv" },
    { id: "Popular", label: "Popular Series", api: POPULAR_SERIES_API, type: "tv" },
    { id: "OnAir", label: "On The Air Today", api: ON_THE_AIR_API, type: "tv" },
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
      <HeroSection movie={featuredShow} mediaType="tv" trailerKey={trailerKey} />
      <div className="mx-auto  px-4 pt-8">
        <DiscoverContent modes={allModes} />
      </div>
    </div>
  );
}
