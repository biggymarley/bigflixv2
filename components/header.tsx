"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  ChevronRight,
  Clock,
  Film,
  Menu,
  Sparkles,
  Tv,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import InfoModal from "@/components/info-modal";
import SearchAutocomplete from "@/components/search-autocomplete";
import type { Genre, Movie } from "@/lib/types";

type NavLink = {
  label: string;
  path: string;
  icon: LucideIcon;
  highlight?: boolean;
};

const navLinks: NavLink[] = [
  { label: "AI Picks", path: "/ai", icon: Sparkles, highlight: true },
  { label: "Movies", path: "/discover/movies", icon: Film },
  { label: "TV Shows", path: "/discover/series", icon: Tv },
  { label: "Watch Later", path: "/watch-later", icon: Bookmark },
  { label: "History", path: "/history", icon: Clock },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresOpen, setGenresOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const pathname = usePathname();
  const genresMenuRef = useRef<HTMLDivElement | null>(null);

  const filteredLinks = navLinks.filter((link) => link.path !== pathname);
  const discoverType = useMemo(() => {
    if (pathname.startsWith("/discover/movies")) return "movies";
    if (pathname.startsWith("/discover/series")) return "series";
    return null;
  }, [pathname]);

  useEffect(() => {
    if (!discoverType) {
      setGenres([]);
      setGenresOpen(false);
      return;
    }

    const endpoint =
      discoverType === "movies" ? "genre/movie/list" : "genre/tv/list";

    fetch(`/api/tmdb/${endpoint}`)
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch(() => setGenres([]));
  }, [discoverType]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!genresMenuRef.current) return;
      if (!genresMenuRef.current.contains(event.target as Node)) {
        setGenresOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full bg-linear-to-b from-black/80 to-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="block">
            <Image
              src="/bigflix.png"
              alt="BigFlix"
              width={160}
              height={45}
              className="h-8 w-auto md:h-10"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {filteredLinks.map((link) =>
              link.highlight ? (
                <Link
                  key={link.path}
                  href={link.path}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-primary hover:bg-primary/20"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.path}
                  href={link.path}
                  className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              )
            )}
            {discoverType && genres.length > 0 && (
              <div className="relative" ref={genresMenuRef}>
                <button
                  type="button"
                  onClick={() => setGenresOpen((prev) => !prev)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                  Genres
                </button>
                {genresOpen && (
                  <div className="absolute left-0 top-10 z-50 w-[520px] rounded-md border border-white/10 bg-black/95 p-3 shadow-xl">
                    <div className="grid grid-cols-3 gap-1">
                      {genres.map((genre) => (
                        <Link
                          key={genre.id}
                          href={`/discover/${discoverType}/category/${genre.id}`}
                          onClick={() => setGenresOpen(false)}
                          className="rounded px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {genre.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <SearchAutocomplete onSelect={setSelectedMovie} />
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 gap-0 border-l border-white/10 bg-gradient-to-b from-[#17171d] via-[#101015] to-[#08080b] p-0"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              {/* Brand header */}
              <div className="flex items-center border-b border-white/10 px-5 py-4">
                <Image
                  src="/bigflix.png"
                  alt="BigFlix"
                  width={140}
                  height={38}
                  className="h-7 w-auto"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                {/* Search */}
                <div className="mb-6">
                  <SearchAutocomplete
                    variant="mobile"
                    onSelect={setSelectedMovie}
                    onSubmit={() => setMobileOpen(false)}
                  />
                </div>

                {/* Menu */}
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Menu
                </p>
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        href={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[15px] font-medium transition-all ${
                          link.highlight
                            ? "bg-gradient-to-r from-primary/30 via-primary/15 to-transparent text-white shadow-[0_0_22px_-8px] shadow-primary ring-1 ring-primary/40"
                            : active
                            ? "bg-white/10 text-white ring-1 ring-white/15"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            link.highlight
                              ? "bg-primary text-white shadow-lg shadow-primary/30"
                              : active
                              ? "bg-white/15 text-white"
                              : "bg-white/5 text-white/60 group-hover:text-white"
                          }`}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="flex-1">{link.label}</span>
                        {link.highlight ? (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            AI
                          </span>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Genres */}
                {discoverType && genres.length > 0 && (
                  <div className="mt-7">
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      Genres
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {genres.map((genre) => (
                        <Link
                          key={genre.id}
                          href={`/discover/${discoverType}/category/${genre.id}`}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {genre.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <InfoModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </header>
  );
}
