const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_TOKEN = process.env.TMDB_TOKEN!;

export const IMAGES_BASE_URL = "https://image.tmdb.org/t/p";

export function imageUrl(path: string | null, size = "w500") {
  if (!path) return "/placeholder.jpg";
  return `${IMAGES_BASE_URL}/${size}${path}`;
}

export function backdropUrl(path: string | null) {
  return imageUrl(path, "original");
}

export async function tmdbFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}/${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
