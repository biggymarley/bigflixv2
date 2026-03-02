"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronRight,
  ChevronLeft,
  Clapperboard,
  Globe2,
  BadgeDollarSign,
  ShieldBan,
  Sparkles,
  BrainCircuit,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Movie } from "@/lib/types";
import { imageUrl, isImageMissing } from "@/lib/tmdb";
import SpotlightCard from "@/components/SpotlightCard";

export default function Home() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTv, setTrendingTv] = useState<Movie[]>([]);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/tmdb/trending/movie/week?page=1").then((r) => r.json()),
      fetch("/api/tmdb/trending/tv/week?page=1").then((r) => r.json()),
    ])
      .then(([moviesData, tvData]) => {
        setTrendingMovies((moviesData.results || []).slice(0, 10));
        setTrendingTv((tvData.results || []).slice(0, 10));
      })
      .catch(() => {
        setTrendingMovies([]);
        setTrendingTv([]);
      });
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
      <div className="relative flex min-h-160 flex-col">
        <Image
          src="/bg.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black" />

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

        {/* Arc glow at the bottom */}
        <div className="pointer-events-none absolute -bottom-1 left-0 right-0 z-10 h-22 overflow-hidden">
          <div
            className="absolute left-[-50%] top-0 h-full w-[200%]"
            style={{
              borderTopLeftRadius: "50% 100%",
              borderTopRightRadius: "50% 100%",
              background:
                "radial-gradient(50% 500% at 50% -420%, rgba(229, 9, 127, 0.35) 45%, rgba(64, 97, 231, 0.35) 70%, rgba(0, 0, 0, 0.08) 100%), black",
            }}
          />
        </div>
      </div>

      {/* ── AI Pick Intro ── */}
      <section className="bg-black px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-6xl items-stretch gap-5 lg:grid-cols-2">
          <SpotlightCard
            className="border-white/15 bg-linear-to-br from-[#111827] to-[#0f172a]"
            spotlightColor="rgba(229, 9, 127, 0.28)"
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Movie Match
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Not sure what to watch tonight?
              </h2>

              <p className="text-sm leading-relaxed text-white/70">
                I built this service because I used to spend way too much time
                searching for something to watch. You answer a few simple
                questions, and the AI gives you 3 movie or TV picks that match
                your mood. Less time searching, more time watching.
              </p>

              <Button
                onClick={() => router.push("/ai")}
                className="mt-2 inline-flex w-fit items-center gap-2"
              >
                Start AI recommendations
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </SpotlightCard>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <SpotlightCard
              className="border-white/10 bg-[#111111]"
              spotlightColor="rgba(64, 97, 231, 0.25)"
            >
              <div className="space-y-3">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-white">
                  Understand your taste
                </h3>
                <p className="text-sm text-white/60">
                  Mood, pace, language, and genre preferences in one quick flow.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard
              className="border-white/10 bg-[#111111]"
              spotlightColor="rgba(229, 9, 127, 0.22)"
            >
              <div className="space-y-3">
                <ListChecks className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-white">
                  Smart 3-title shortlist
                </h3>
                <p className="text-sm text-white/60">
                  The AI returns 3 focused picks instead of overwhelming lists.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* ── Trending Now ── */}
      <div className="space-y-4">
        <TrendingSlider
          title="Trending Movies"
          mediaType="movie"
          trending={trendingMovies}
        />
        <TrendingSlider
          title="Trending TV Shows"
          mediaType="tv"
          trending={trendingTv}
        />
      </div>

      {/* ── More Reasons to Join ── */}
      <section className="bg-black px-6 py-16 md:px-12">
        <h2 className="mb-10 text-center text-xl font-bold text-white md:text-2xl">
          More Reasons to Join
        </h2>
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReasonCard
            icon={<Clapperboard className="h-8 w-8 text-primary" />}
            title="Bigger library than Netflix"
            description="More movies and TV shows than Netflix."
          />
          <ReasonCard
            icon={<Globe2 className="h-8 w-8 text-primary" />}
            title="Region locks? Nobody cares"
            description="Nobody cares about your region here. You can watch Borat in Kazakhstan too."
          />
          <ReasonCard
            icon={<BadgeDollarSign className="h-8 w-8 text-primary" />}
            title="Free forever"
            description="This site will always stay free. Zero subscriptions, zero drama, maximum vibes."
          />
          <ReasonCard
            icon={<ShieldBan className="h-8 w-8 text-primary" />}
            title="Use an ad blocker SERIOUSLY"
            description="I do not earn anything from this website, so you might as well enjoy it with ad blocker on."
          />
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="h-1 bg-[#232323]" />

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

function TrendingSlider({
  title,
  mediaType,
  trending,
}: {
  title: string;
  mediaType: "movie" | "tv";
  trending: Movie[];
}) {
  const router = useRouter();
  const seeMoreHref = mediaType === "movie" ? "/discover/movies" : "/discover/series";
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
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
        <Link
          href={seeMoreHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-1.5 hover:text-primary/90"
        >
          See more
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="group relative">
        {canPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-md bg-[#141414]/85 px-2.5 py-3 opacity-0 transition-opacity hover:bg-[#141414] group-hover:opacity-100"
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
        )}

        <div ref={emblaRef} className="overflow-hidden px-12 md:px-14">
          <div className="flex gap-4 md:gap-8">
            {trending.map((movie, i) => {
              const title = movie.title || movie.name || "Untitled";
              const missingPoster = isImageMissing(movie.poster_path);
              return (
                <button
                  key={movie.id}
                  onClick={() =>
                    router.push(
                      mediaType === "tv"
                        ? `/watch/${movie.id}?type=tv`
                        : `/watch/${movie.id}`
                    )
                  }
                  className="group/card relative shrink-0 basis-[30%] sm:basis-[22%] md:basis-[18%] lg:basis-[15%]"
                >
                  <div className="relative aspect-2/3 w-full overflow-hidden rounded-md transition-transform duration-300 group-hover/card:scale-105">
                    {missingPoster ? (
                      <div className="absolute inset-0 bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
                    ) : (
                      <Image
                        src={imageUrl(movie.poster_path)}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 15vw"
                      />
                    )}
                    {missingPoster && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-2 text-center text-xs font-semibold text-white">
                        Image not available
                      </div>
                    )}
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
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-md bg-[#141414]/85 px-2.5 py-3 opacity-0 transition-opacity hover:bg-[#141414] group-hover:opacity-100"
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
    <div className="flex flex-col gap-4 rounded-xl bg-linear-to-br from-[#1a1a2e] to-[#16213e] p-6">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-white/60">
        {description}
      </p>
      <div className="self-end">{icon}</div>
    </div>
  );
}
