"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Movie, TMDBResponse } from "@/lib/types";

interface UseInfiniteTmdbOptions {
  endpoint: string;
  /** Query params (excluding `page`) sent to the TMDB endpoint. */
  params: Record<string, string>;
  /** Optional cap on total pages (e.g. TMDB discover limit of 500). */
  maxPages?: number;
  /** IntersectionObserver root margin for triggering the next page. */
  rootMargin?: string;
}

/**
 * Paginated TMDB fetching with infinite scroll. Returns the accumulated items
 * plus the loading flags and the sentinel ref to attach to the load-more anchor.
 */
export function useInfiniteTmdb({
  endpoint,
  params,
  maxPages,
  rootMargin = "200px",
}: UseInfiniteTmdbOptions) {
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const paramsKey = JSON.stringify(params);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const search = new URLSearchParams({
          page: String(nextPage),
          ...params,
        });
        const res = await fetch(`/api/tmdb/${endpoint}?${search.toString()}`);
        const data = (await res.json()) as TMDBResponse<Movie>;
        const results = data.results || [];

        setItems((prev) => (append ? [...prev, ...results] : results));
        setPage(data.page || nextPage);
        const total = data.total_pages || 1;
        setTotalPages(maxPages ? Math.min(total, maxPages) : total);
      } catch {
        if (!append) setItems([]);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    // params is read through paramsKey to keep the callback stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, paramsKey, maxPages]
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (loading || loadingMore || page >= totalPages || !loadMoreRef.current)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchPage(page + 1, true);
        }
      },
      { rootMargin }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchPage, loading, loadingMore, page, totalPages, rootMargin]);

  return { items, loading, loadingMore, loadMoreRef };
}
