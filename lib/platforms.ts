import { tmdbFetch } from "@/lib/tmdb";

export type Platform = {
  slug: string;
  name: string;
  providerId: number;
  logoPath: string;
  /** Dominant brand color of the logo, used to tint the platform page. */
  color: string;
  description: string;
};

// Catalog is resolved through TMDB watch-providers locked to a single region,
// so every visitor sees the same stable platform catalog regardless of location.
export const WATCH_REGION = "US";

/** Fallback tint for non-featured providers reached by direct URL. */
const DEFAULT_COLOR = "#3f3f46";

type Override = {
  providerId: number;
  slug: string;
  color: string;
  description: string;
  /** Cleaner display name when TMDB's is awkward (e.g. "Paramount Plus Premium"). */
  name?: string;
};

/**
 * Hand-picked subscription/FAST streamers, in the order they should appear.
 * Name and logo are pulled live from TMDB by provider id; slug, brand color,
 * marketing copy (and an optional cleaner name) are curated here. Providers not
 * in this list are excluded from the rail but still resolve by direct URL with
 * a generated slug and default branding.
 */
const FEATURED: Override[] = [
  {
    providerId: 8,
    slug: "netflix",
    color: "#E80814",
    description:
      "The original streaming giant — home to award-winning Originals, blockbuster films, and binge-worthy series across every genre.",
  },
  {
    providerId: 337,
    slug: "disney-plus",
    name: "Disney+",
    color: "#0195A3",
    description:
      "Disney, Pixar, Marvel, Star Wars, and National Geographic — all the iconic franchises and family favorites in one place.",
  },
  {
    providerId: 9,
    slug: "prime-video",
    name: "Prime Video",
    color: "#1572FF",
    description:
      "Amazon's streaming home for Originals, hit movies, and thousands of titles to stream, rent, or buy.",
  },
  {
    providerId: 1899,
    slug: "hbo-max",
    name: "HBO Max",
    color: "#7B2BF9",
    description:
      "Premium prestige TV and major theatrical films — from acclaimed HBO dramas to Warner Bros. blockbusters.",
  },
  {
    providerId: 15,
    slug: "hulu",
    color: "#1CE783",
    description:
      "Next-day TV from major networks, a deep movie catalog, and a growing lineup of Hulu Originals.",
  },
  {
    providerId: 350,
    slug: "apple-tv",
    name: "Apple TV+",
    color: "#6E7681",
    description:
      "A curated slate of high-end Originals — critically acclaimed series and films made exclusively for Apple TV+.",
  },
  {
    providerId: 386,
    slug: "peacock",
    name: "Peacock",
    color: "#6D5BD0",
    description:
      "NBCUniversal's hub for hit shows, movies, live sports, and current-season network TV.",
  },
  {
    providerId: 2303,
    slug: "paramount-plus",
    name: "Paramount+",
    color: "#0064FF",
    description:
      "A Mountain of Entertainment — CBS, Nickelodeon, MTV, and Showtime titles plus Paramount blockbusters and Originals.",
  },
  {
    providerId: 190,
    slug: "curiosity-stream",
    name: "CuriosityStream",
    color: "#1BA7DF",
    description:
      "Award-winning documentaries and nonfiction series spanning science, history, nature, and technology.",
  },
  {
    providerId: 258,
    slug: "criterion-channel",
    name: "The Criterion Channel",
    color: "#2C2C2C",
    description:
      "A continuously refreshed showcase of classic and contemporary cinema, curated for film lovers.",
  },
  {
    providerId: 1964,
    slug: "national-geographic",
    name: "National Geographic",
    color: "#FFCC00",
    description:
      "Bold storytelling from the world of science and exploration — landmark documentaries and nature series.",
  },
];

const OVERRIDES = new Map(FEATURED.map((o) => [o.providerId, o]));
const FEATURED_ORDER = new Map(FEATURED.map((o, i) => [o.providerId, i]));

type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

type ProvidersResponse = { results: TmdbProvider[] };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\+/g, "-plus")
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toPlatform(p: TmdbProvider): Platform {
  const override = OVERRIDES.get(p.provider_id);
  return {
    slug: override?.slug ?? slugify(p.provider_name),
    name: override?.name ?? p.provider_name,
    providerId: p.provider_id,
    logoPath: p.logo_path ?? "",
    color: override?.color ?? DEFAULT_COLOR,
    description:
      override?.description ??
      `Browse the movies and TV shows available to stream on ${p.provider_name}.`,
  };
}

let cache: Promise<Platform[]> | null = null;

async function loadAllPlatforms(): Promise<Platform[]> {
  const [movies, tv] = await Promise.all([
    tmdbFetch<ProvidersResponse>("watch/providers/movie", {
      watch_region: WATCH_REGION,
    }),
    tmdbFetch<ProvidersResponse>("watch/providers/tv", {
      watch_region: WATCH_REGION,
    }),
  ]);

  // Union both lists by provider id so a TV-only provider is still reachable.
  const byId = new Map<number, TmdbProvider>();
  for (const p of [...movies.results, ...tv.results]) {
    if (!byId.has(p.provider_id)) byId.set(p.provider_id, p);
  }

  const platforms = [...byId.values()].map(toPlatform);

  // Guarantee slug uniqueness — append the provider id to any collision so
  // every platform resolves to exactly one page.
  const seen = new Set<string>();
  for (const platform of platforms) {
    if (seen.has(platform.slug)) {
      platform.slug = `${platform.slug}-${platform.providerId}`;
    }
    seen.add(platform.slug);
  }

  return platforms;
}

function getAllPlatforms(): Promise<Platform[]> {
  if (!cache) cache = loadAllPlatforms();
  return cache;
}

/** Curated, ranked subscription/FAST streamers shown in the platform rail. */
export async function getPlatforms(): Promise<Platform[]> {
  const all = await getAllPlatforms();
  return all
    .filter((p) => FEATURED_ORDER.has(p.providerId))
    .sort(
      (a, b) =>
        FEATURED_ORDER.get(a.providerId)! - FEATURED_ORDER.get(b.providerId)!
    );
}

/** Resolves any provider by slug — featured or not — so direct URLs still work. */
export async function getPlatform(slug: string): Promise<Platform | undefined> {
  const all = await getAllPlatforms();
  return all.find((p) => p.slug === slug);
}
