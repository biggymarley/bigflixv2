"use client";

import { useEffect, useState } from "react";
import type { MovieDetails } from "@/lib/types";

interface StoredItem {
  id: number;
  type: "movie" | "tv";
}

/**
 * Fetches full TMDB details for a list of stored items (watch history / watch
 * later) and maps each result into the caller's shape via `normalize`.
 *
 * Note: `normalize` receives the index within the *filtered* result list, which
 * is how both call sites have always aligned items — preserved intentionally.
 */
export function useStoredTitleDetails<I extends StoredItem, T>(
  items: I[],
  normalize: (result: MovieDetails, item: I | undefined, index: number) => T
): { titles: T[]; loading: boolean } {
  const [titles, setTitles] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setTitles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      items.map((item) =>
        fetch(
          `/api/tmdb/${item.type === "tv" ? "tv" : "movie"}/${item.id}`
        ).then((res) => res.json())
      )
    )
      .then((results: MovieDetails[]) => {
        setTitles(
          results
            .filter(Boolean)
            .map((result, index) => normalize(result, items[index], index))
        );
      })
      .catch(() => setTitles([]))
      .finally(() => setLoading(false));
    // normalize is intentionally excluded; the effect re-runs only when items change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return { titles, loading };
}
