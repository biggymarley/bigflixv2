"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imageUrl } from "@/lib/tmdb";
import type { Movie, TMDBResponse } from "@/lib/types";

interface SearchAutocompleteProps {
  variant?: "desktop" | "mobile" | "hero";
  onSelect: (movie: Movie) => void;
  onSubmit?: () => void;
}

export default function SearchAutocomplete({
  variant = "desktop",
  onSelect,
  onSubmit,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q)}&include_adult=false`,
        { signal: controller.signal }
      )
        .then((r) => r.json())
        .then((data: TMDBResponse<Movie>) => {
          const filtered = (data.results || [])
            .filter(
              (m) =>
                m.media_type === "movie" ||
                m.media_type === "tv" ||
                m.media_type === "person"
            )
            .slice(0, 7);
          setResults(filtered);
          setActiveIndex(-1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goSearch = (q: string) => {
    if (!q.trim()) return;
    router.push(`/browse/${encodeURIComponent(q.trim())}`);
    setOpen(false);
    setQuery("");
    onSubmit?.();
  };

  const pick = (m: Movie) => {
    onSelect({ ...m, media_type: m.media_type || "movie" });
    setQuery("");
    setResults([]);
    setOpen(false);
    onSubmit?.();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        pick(results[activeIndex]);
      } else {
        goSearch(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isMobile = variant === "mobile";
  const isHero = variant === "hero";
  const showDropdown = open && query.trim().length >= 2;

  const indicator = loading ? (
    <Loader2
      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/50 ${
        isHero ? "right-4" : "right-3"
      }`}
    />
  ) : query ? (
    <button
      type="button"
      onClick={() => {
        setQuery("");
        setResults([]);
      }}
      className={`absolute top-1/2 -translate-y-1/2 text-white/40 hover:text-white ${
        isHero ? "right-4" : "right-2.5"
      }`}
      aria-label="Clear search"
    >
      <X className={isHero ? "h-5 w-5" : "h-4 w-4"} />
    </button>
  ) : null;

  const inputEl = (
    <Input
      placeholder={
        isHero ? "Search movies, TV shows, people..." : "Search movies & shows..."
      }
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      onKeyDown={onKeyDown}
      className={
        isHero
          ? "h-14 rounded-r-none border-white/20 bg-black/60 pl-11 pr-11 text-base text-white placeholder:text-white/40 focus:border-white/40 md:h-16 md:text-lg"
          : isMobile
          ? "h-11 rounded-xl border-white/10 bg-white/5 pl-9 pr-9 text-white placeholder:text-white/40 focus:border-primary/50"
          : "w-52 border-white/20 bg-black/50 pl-9 pr-9 text-sm text-white placeholder:text-white/40 transition-all focus:w-64 lg:w-60 lg:focus:w-80"
      }
    />
  );

  return (
    <div ref={containerRef} className="relative">
      {isHero ? (
        <div className="flex">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            {inputEl}
            {indicator}
          </div>
          <Button
            onClick={() => goSearch(query)}
            size="lg"
            className="h-14 gap-1.5 rounded-l-none px-6 text-base font-semibold md:h-16 md:px-8 md:text-xl"
          >
            Search
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          {inputEl}
          {indicator}
        </>
      )}

      {showDropdown && (
        <div
          className={`absolute z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-[#101015]/95 p-1.5 text-left shadow-2xl backdrop-blur-xl ${
            isHero ? "inset-x-0" : "right-0 w-full min-w-72 md:w-96"
          }`}
        >
          {results.length === 0 && !loading ? (
            <p className="px-3 py-6 text-center text-sm text-white/50">
              No results for “{query.trim()}”
            </p>
          ) : (
            <>
              {results.map((m, i) => {
                const title = m.title || m.name || "Untitled";
                const isPerson = m.media_type === "person";
                const thumb = isPerson ? m.profile_path : m.poster_path;
                const year =
                  (m.release_date || m.first_air_date)?.split("-")[0] || "";
                const typeLabel =
                  m.media_type === "tv"
                    ? "TV"
                    : m.media_type === "person"
                    ? "Person"
                    : "Movie";
                return (
                  <button
                    key={`${m.media_type}-${m.id}`}
                    type="button"
                    onClick={() => pick(m)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors ${
                      activeIndex === i ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-white/5">
                      <Image
                        src={imageUrl(thumb ?? null, "w92")}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-white/45">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                          {typeLabel}
                        </span>
                        {year && <span>{year}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => goSearch(query)}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-primary transition-colors hover:bg-white/5"
              >
                <Search className="h-3.5 w-3.5" />
                See all results for “{query.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
