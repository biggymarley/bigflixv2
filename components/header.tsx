"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Genre } from "@/lib/types";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Movies", path: "/discover/movies" },
  { label: "TV Shows", path: "/discover/series" },
  { label: "Watch Later", path: "/watch-later" },
  { label: "History", path: "/history" },
];

export default function Header() {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresOpen, setGenresOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const genresMenuRef = useRef<HTMLDivElement | null>(null);

  const filteredLinks = navLinks.filter((link) => link.path !== pathname);
  const discoverType = useMemo(() => {
    if (pathname.startsWith("/discover/movies")) return "movies";
    if (pathname.startsWith("/discover/series")) return "series";
    return null;
  }, [pathname]);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/browse/${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

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
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
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
          <div className="hidden items-center gap-1 sm:flex">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search movies & shows..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-48 border-white/20 bg-black/50 pl-9 text-sm text-white placeholder:text-white/40 focus:w-64 transition-all lg:w-56 lg:focus:w-72"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-white/10 bg-[#141414]">
              <div className="mt-8 flex flex-col gap-2">
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      handleKeyDown(e);
                      if (e.key === "Enter") setMobileOpen(false);
                    }}
                    className="border-white/20 bg-black/50 pl-9 text-white placeholder:text-white/40"
                  />
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      pathname === link.path
                        ? "bg-primary/20 text-primary"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {discoverType && genres.length > 0 && (
                  <div className="mt-2 space-y-2 rounded-md border border-white/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                      Genres
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {genres.map((genre) => (
                        <Link
                          key={genre.id}
                          href={`/discover/${discoverType}/category/${genre.id}`}
                          onClick={() => setMobileOpen(false)}
                          className="rounded px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
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
    </header>
  );
}
