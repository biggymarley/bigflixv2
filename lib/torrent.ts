// Client-side torrent resolver.
//
// Torrentio blocks datacenter IPs (so our Oracle box gets 403), but allows
// browser CORS calls from residential IPs — exactly like the Stremio app. So we
// resolve the magnet here in the browser, then hand only the infohash + fileIdx
// to the streaming box. If Torrentio is unreachable, the caller falls back to
// the box's own ?imdb= resolver (YTS).

const TORRENTIO_BASE =
  process.env.NEXT_PUBLIC_TORRENTIO_BASE || "https://torrentio.strem.fun";
const TORRENTIO_OPTS = "sort=seeders|qualityfilter=480p,scr,cam,unknown";

export interface TorrentPick {
  hash: string;
  fileIdx: number | null;
  codec: "x264" | "x265";
  quality: string;
  seeds: number;
  title: string; // release / file name for display
  size: string; // e.g. "1.85 GB"
  provider: string; // e.g. "1337x"
}

interface TorrentioStream {
  name?: string;
  title?: string;
  infoHash?: string;
  fileIdx?: number;
}

function parse(s: TorrentioStream): TorrentPick | null {
  if (!s.infoHash) return null;
  const text = `${s.name || ""}\n${s.title || ""}`;
  const seedM = text.match(/👤\s*(\d+)/);
  const sizeM = text.match(/💾\s*([\d.]+\s*[GM]B)/i);
  const provM = text.match(/⚙️\s*([^\n]+)/);
  let q = (text.match(/(2160p|1080p|720p|480p)/i) || [])[1];
  if (!q && /\b4k\b/i.test(text)) q = "2160p";
  const hevc = /x265|hevc|h\.?265|av1/i.test(text);
  // Release/file name: prefer the line that looks like a filename.
  const fileLine =
    (s.title || "").split("\n").find((l) => /\.(mp4|mkv|avi)/i.test(l)) ||
    (s.title || "").split("\n")[0] ||
    s.name ||
    "";
  return {
    hash: s.infoHash,
    fileIdx: typeof s.fileIdx === "number" ? s.fileIdx : null,
    seeds: seedM ? parseInt(seedM[1], 10) : 0,
    quality: q ? q.toLowerCase() : "unknown",
    codec: hevc ? "x265" : "x264",
    title: fileLine.trim(),
    size: sizeM ? sizeM[1].replace(/\s+/, " ") : "",
    provider: provM ? provM[1].trim() : "",
  };
}

export interface ResolveOpts {
  type?: "movie" | "tv";
  season?: number;
  episode?: number;
  signal?: AbortSignal;
}

/**
 * Return the ranked list of torrent candidates for a movie or TV episode
 * (browser-side). Empty array if Torrentio is unreachable or has no results.
 */
export async function listTorrents(
  imdb: string,
  opts: ResolveOpts = {}
): Promise<TorrentPick[]> {
  const { type = "movie", season, episode, signal } = opts;
  const path =
    type === "tv"
      ? `stream/series/${imdb}:${season}:${episode}.json`
      : `stream/movie/${imdb}.json`;
  try {
    const res = await fetch(`${TORRENTIO_BASE}/${TORRENTIO_OPTS}/${path}`, {
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { streams?: TorrentioStream[] };
    const picks = (data.streams || [])
      .map(parse)
      .filter((p): p is TorrentPick => p !== null);

    // Dedupe by infohash, keeping the first (highest seeded) occurrence.
    const seen = new Set<string>();
    const unique = picks.filter((p) =>
      seen.has(p.hash) ? false : (seen.add(p.hash), true)
    );

    // Sorted by most seeders (x264 wins ties — cheaper to stream).
    unique.sort((a, b) => {
      if (b.seeds !== a.seeds) return b.seeds - a.seeds;
      return (a.codec === "x264" ? 0 : 1) - (b.codec === "x264" ? 0 : 1);
    });
    return unique;
  } catch {
    return [];
  }
}

/** Most-seeded single pick (or null). Convenience wrapper around listTorrents. */
export async function resolveTorrent(
  imdb: string,
  opts: ResolveOpts = {}
): Promise<TorrentPick | null> {
  const list = await listTorrents(imdb, opts);
  return list[0] || null;
}
