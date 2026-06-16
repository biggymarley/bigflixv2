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

export const PLATFORMS: Platform[] = [
  {
    slug: "netflix",
    name: "Netflix",
    providerId: 8,
    logoPath: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
    color: "#E80814",
    description:
      "The original streaming giant — home to award-winning Originals, blockbuster films, and binge-worthy series across every genre.",
  },
  {
    slug: "disney-plus",
    name: "Disney+",
    providerId: 337,
    logoPath: "/97yvRBw1GzX7fXprcF80er19ot.jpg",
    color: "#0195A3",
    description:
      "Disney, Pixar, Marvel, Star Wars, and National Geographic — all the iconic franchises and family favorites in one place.",
  },
  {
    slug: "hbo-max",
    name: "HBO Max",
    providerId: 1899,
    logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
    color: "#000000",
    description:
      "Premium prestige TV and major theatrical films — from acclaimed HBO dramas to Warner Bros. blockbusters.",
  },
  {
    slug: "prime-video",
    name: "Prime Video",
    providerId: 9,
    logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg",
    color: "#1572FF",
    description:
      "Amazon's streaming home for Originals, hit movies, and thousands of titles to stream, rent, or buy.",
  },
  {
    slug: "apple-tv",
    name: "Apple TV+",
    providerId: 350,
    logoPath: "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg",
    color: "#6E7681",
    description:
      "A curated slate of high-end Originals — critically acclaimed series and films made exclusively for Apple TV+.",
  },
  {
    slug: "hulu",
    name: "Hulu",
    providerId: 15,
    logoPath: "/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg",
    color: "#1CE783",
    description:
      "Next-day TV from major networks, a deep movie catalog, and a growing lineup of Hulu Originals.",
  },
  {
    slug: "peacock",
    name: "Peacock",
    providerId: 386,
    logoPath: "/2aGrp1xw3qhwCYvNGAJZPdjfeeX.jpg",
    color: "#6D5BD0",
    description:
      "NBCUniversal's hub for hit shows, movies, live sports, and current-season network TV.",
  },
];

export function getPlatform(slug: string): Platform | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}
