"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronRight,
  ChevronLeft,
  Tv,
  Download,
  Monitor,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Movie } from "@/lib/types";
import { imageUrl } from "@/lib/tmdb";

export default function Home() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [trending, setTrending] = useState<Movie[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/tmdb/trending/all/week?page=1")
      .then((r) => r.json())
      .then((d) => setTrending((d.results || []).slice(0, 10)))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    if (!query.trim()) {
      setError("Please enter a movie or TV show name");
      return;
    }
    setError("");
    router.push(`/browse/${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* ── Hero Section ── */}
      <div className="relative flex min-h-[40rem] flex-col">
        <Image
          src="/bg.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
          <Image
            src="/bigflix.png"
            alt="BigFlix"
            width={160}
            height={45}
            className="h-8 w-auto md:h-11"
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
              onClick={() => router.push("/discover/movies")}
            >
              Movies
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
              onClick={() => router.push("/discover/series")}
            >
              TV Shows
            </Button>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <div className="mx-auto max-w-2xl space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
              Unlimited movies, TV
              <br />
              shows, and more
            </h1>

            <p className="text-lg font-medium text-white/80 md:text-xl">
              Watch anywhere. Cancel anytime.
            </p>

            <p className="text-sm text-white/60 md:text-base">
              Ready to watch? Enter your Movie or TV Show.
            </p>

            <div className="mx-auto w-full max-w-lg pt-2">
              <div className="flex gap-0">
                <Input
                  placeholder="Search movies, TV shows, people..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-14 rounded-r-none border-white/20 bg-black/60 px-5 text-base text-white placeholder:text-white/40 focus:border-white/40 md:h-16 md:text-lg"
                />
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="h-14 gap-1.5 rounded-l-none px-6 text-base font-semibold md:h-16 md:px-8 md:text-xl"
                >
                  Search
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-left text-sm text-red-400">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Arc curve at the bottom */}
        <div className="absolute -bottom-1 left-0 right-0 z-10">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path d="M0 80V30C360 0 1080 0 1440 30V80H0Z" fill="black" />
          </svg>
        </div>
      </div>

      {/* ── Trending Now ── */}
      <TrendingSlider trending={trending} />

      {/* ── Divider ── */}
      <div className="h-2 bg-[#232323]" />

      {/* ── More Reasons to Join ── */}
      <section className="bg-black px-6 py-16 md:px-12">
        <h2 className="mb-10 text-center text-xl font-bold text-white md:text-2xl">
          More Reasons to Join
        </h2>
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReasonCard
            icon={<Tv className="h-8 w-8 text-primary" />}
            title="Enjoy on your TV"
            description="Watch on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players, and more."
          />
          <ReasonCard
            icon={<Download className="h-8 w-8 text-primary" />}
            title="Download your shows to watch offline"
            description="Save your favorites easily and always have something to watch."
          />
          <ReasonCard
            icon={<Monitor className="h-8 w-8 text-primary" />}
            title="Watch everywhere"
            description="Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV."
          />
          <ReasonCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Create profiles for kids"
            description="Send kids on adventures with their favorite characters in a space made just for them."
          />
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="h-2 bg-[#232323]" />

      {/* ── Bottom CTA ── */}
      <section className="bg-black px-6 py-16 text-center">
        <p className="mb-5 text-sm text-white/60 md:text-base">
          Ready to watch? Enter your Movie or TV Show.
        </p>
        <div className="mx-auto flex max-w-lg gap-0">
          <Input
            placeholder="Search movies, TV shows..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            className="h-14 rounded-r-none border-white/20 bg-[#1a1a1a] px-5 text-base text-white placeholder:text-white/40"
          />
          <Button
            onClick={handleSearch}
            size="lg"
            className="h-14 gap-1.5 rounded-l-none px-6 text-base font-semibold"
          >
            Get Started
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-black px-6 py-8 text-center">
        <p className="text-sm text-white/40">BigFlix &mdash; Streaming Demo</p>
      </footer>
    </div>
  );
}

function TrendingSlider({ trending }: { trending: Movie[] }) {
  const router = useRouter();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 2,
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="relative z-10 bg-black px-6 pb-16 md:px-12">
      <h2 className="mb-6 text-xl font-bold text-white md:text-2xl">
        Trending Now
      </h2>

      <div className="group relative">
        {canPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute -left-2 top-0 z-20 flex h-full items-center rounded-r-lg bg-[#141414]/80 px-3 opacity-0 transition-opacity hover:bg-[#141414] group-hover:opacity-100"
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
        )}

        <div ref={emblaRef} className="overflow-hidden px-8">
          <div className="flex gap-4 md:gap-8">
            {trending.map((movie, i) => {
              const title = movie.title || movie.name || "Untitled";
              const type = movie.media_type === "tv" ? "tv" : "movie";
              return (
                <button
                  key={movie.id}
                  onClick={() =>
                    router.push(
                      type === "tv"
                        ? `/watch/${movie.id}?type=tv`
                        : `/watch/${movie.id}`
                    )
                  }
                  className="group/card relative shrink-0 basis-[30%] sm:basis-[22%] md:basis-[18%] lg:basis-[15%]"
                >
                  <div className="relative aspect-2/3 w-full overflow-hidden rounded-md transition-transform duration-300 group-hover/card:scale-105">
                    <Image
                      src={imageUrl(movie.poster_path)}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 15vw"
                    />
                  </div>
                  <span
                    className="absolute -bottom-2 -left-3 select-none text-[4rem]  leading-none text-black md:-left-4 md:text-[5.5rem] font-extrabold"
                    style={{ WebkitTextStroke: "2px #fff" }}
                  >
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {canNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute -right-2 top-0 z-20 flex h-full items-center rounded-l-lg bg-[#141414]/80 px-3 opacity-0 transition-opacity hover:bg-[#141414] group-hover:opacity-100"
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        )}
      </div>
    </section>
  );
}

function ReasonCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-white/60">
        {description}
      </p>
      <div className="self-end">{icon}</div>
    </div>
  );
}
