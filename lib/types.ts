export interface Movie {
  id: number;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  media_type?: "movie" | "tv" | "person";
  popularity: number;
  adult?: boolean;
  profile_path?: string | null;
  known_for_department?: string;
  known_for?: Movie[];
}

export interface MovieDetails extends Movie {
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: Genre[];
  status: string;
  tagline?: string;
  homepage?: string;
  seasons?: Season[];
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  overview: string;
  air_date: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
  runtime?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface PersonCredit {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  character?: string;
  job?: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  also_known_as?: string[];
  popularity?: number;
  combined_credits?: {
    cast: PersonCredit[];
    crew: PersonCredit[];
  };
}

export interface SliderMode {
  id: string;
  label: string;
  api: string;
  params?: Record<string, string>;
  type?: "movie" | "tv";
}

export interface WatchLaterItem {
  id: number;
  type: "movie" | "tv";
}
