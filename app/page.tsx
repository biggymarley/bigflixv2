"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Clapperboard,
  Globe2,
  BadgeDollarSign,
  ShieldBan,
  Sparkles,
  ShieldCheck,
  Download,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/header";
import InfoModal from "@/components/info-modal";
import MediaRow from "@/components/media-row";
import PlatformRail from "@/components/platform-rail";
import SearchAutocomplete from "@/components/search-autocomplete";
import type { Movie, MovieDetails } from "@/lib/types";
import SpotlightCard from "@/components/SpotlightCard";
import { useWatchHistory } from "@/hooks/use-watch-history";
import { useWatchLater } from "@/hooks/use-watch-later";

type HistoryCard = MovieDetails & {
  rowType: "movie" | "tv";
  season?: number;
  episode?: number;
};
type LaterCard = MovieDetails & { rowType: "movie" | "tv" };

export default function Home() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTv, setTrendingTv] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [historyTitles, setHistoryTitles] = useState<HistoryCard[]>([]);
  const [laterTitles, setLaterTitles] = useState<LaterCard[]>([]);
  const router = useRouter();
  const { items: historyItems } = useWatchHistory();
  const { items: laterItems } = useWatchLater();

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

  useEffect(() => {
    if (historyItems.length === 0) {
      setHistoryTitles([]);
      return;
    }
    Promise.all(
      historyItems.map((item) =>
        fetch(`/api/tmdb/${item.type === "tv" ? "tv" : "movie"}/${item.id}`).then((r) =>
          r.json()
        )
      )
    )
      .then((results) => {
        setHistoryTitles(
          results.filter(Boolean).map((result, index) => ({
            ...result,
            rowType: historyItems[index]?.type || "movie",
            season: historyItems[index]?.season,
            episode: historyItems[index]?.episode,
          })) as HistoryCard[]
        );
      })
      .catch(() => setHistoryTitles([]));
  }, [historyItems]);

  useEffect(() => {
    if (laterItems.length === 0) {
      setLaterTitles([]);
      return;
    }
    Promise.all(
      laterItems.map((item) =>
        fetch(`/api/tmdb/${item.type === "tv" ? "tv" : "movie"}/${item.id}`).then((r) =>
          r.json()
        )
      )
    )
      .then((results) => {
        setLaterTitles(
          results.filter(Boolean).map((result, index) => ({
            ...result,
            rowType: laterItems[index]?.type || "movie",
          })) as LaterCard[]
        );
      })
      .catch(() => setLaterTitles([]));
  }, [laterItems]);

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

  const handleTrendingInfoClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setInfoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      {/* ── Hero Section ── */}
      <div className="relative z-30 flex min-h-160 flex-col">
        <Image
          src="/bg.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-20 text-center md:pt-24">
          <div className="mx-auto max-w-2xl space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
              Unlimited movies, TV
              <br />
              shows, and more
            </h1>

            <p className="text-lg font-medium text-white/80 md:text-xl">
              Watch anywhere. for free.
            </p>

            <p className="text-sm text-white/60 md:text-base">
              Ready to watch? Enter your Movie or TV Show.
            </p>

            <div className="mx-auto w-full max-w-lg pt-2">
              <SearchAutocomplete
                variant="hero"
                onSelect={handleTrendingInfoClick}
              />
            </div>

            <div className="flex flex-col items-center gap-3 pt-1">
              <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-white/40">
                <span className="h-px w-8 bg-white/20" />
                or
                <span className="h-px w-8 bg-white/20" />
              </div>
              <button
                onClick={() => router.push("/ai")}
                className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 backdrop-blur transition-all hover:border-primary hover:bg-primary/20"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Let AI pick for you
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Arc glow at the bottom */}
        <div className="pointer-events-none absolute -bottom-1 left-0 right-0 z-1 h-22 overflow-hidden">
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

     

      {/* ── Browse by platform ── */}
      <PlatformRail />

      {/* ── AI Movie Match (top priority) ── */}
      <section className="relative bg-black px-6 pb-12 pt-20 md:px-12 md:pb-16 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1c1026] via-[#14121f] to-[#0b1322] shadow-2xl shadow-black/40">
            <div className="grid items-stretch gap-8 p-6 md:p-10 lg:grid-cols-[1.15fr_1fr]">
              {/* Pitch */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Movie Match
                </div>

                <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Don&apos;t know what to watch?{" "}
                  <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
                    Let AI decide.
                  </span>
                </h2>

                <p className="max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                  Answer 5 quick questions about your mood, who you&apos;re with, and
                  the vibe you want — and get 3 hand-picked movies or shows in
                  seconds. Less scrolling, more watching.
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Your mood",
                    "Who's watching",
                    "Genre vibe",
                    "Gems or hits",
                  ].map((step, i) => (
                    <span
                      key={step}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      <span className="font-semibold text-primary">{i + 1}</span>
                      {step}
                    </span>
                  ))}
                </div>

                <Button
                  onClick={() => router.push("/ai")}
                  size="lg"
                  className="mt-1 inline-flex w-fit items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Start AI recommendations
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* AI assistant avatar */}
              <div className="relative flex min-h-[360px] items-end justify-center lg:min-h-0">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
                </div>
                <Image
                  src="/ai-assistantt.png"
                  alt="BigFlix AI assistant"
                  width={640}
                  height={800}
                  className="relative h-auto w-full max-w-[480px] drop-shadow-2xl lg:absolute lg:-bottom-10 lg:left-1/2 lg:h-[170%] lg:w-auto lg:max-w-none lg:-translate-x-1/2"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Rows ── */}
      <div className="pt-2">
        {historyTitles.length > 0 && (
          <MediaRow
            title="Continue Watching"
            seeMoreHref="/history"
            cards={historyTitles.map((t) => ({
              key: `history-${t.rowType}-${t.id}`,
              poster_path: t.poster_path,
              title: t.title || t.name || "Untitled",
              onClick: () =>
                router.push(
                  t.rowType === "tv"
                    ? `/watch/${t.id}?type=tv&se=${t.season || 1}&ep=${
                        t.episode || 1
                      }`
                    : `/watch/${t.id}?type=movie`
                ),
            }))}
          />
        )}
        {laterTitles.length > 0 && (
          <MediaRow
            title="Watch Later"
            seeMoreHref="/watch-later"
            cards={laterTitles.map((t) => ({
              key: `later-${t.rowType}-${t.id}`,
              poster_path: t.poster_path,
              title: t.title || t.name || "Untitled",
              onClick: () =>
                handleTrendingInfoClick({ ...t, media_type: t.rowType }),
            }))}
          />
        )}
        <MediaRow
          title="Trending Movies"
          seeMoreHref="/discover/movies"
          cards={trendingMovies.map((m, i) => ({
            key: `tm-${m.id}`,
            poster_path: m.poster_path,
            title: m.title || m.name || "Untitled",
            rank: i + 1,
            meta: m.vote_average ? m.vote_average.toFixed(1) : undefined,
            onClick: () => handleTrendingInfoClick({ ...m, media_type: "movie" }),
          }))}
        />
        <MediaRow
          title="Trending TV Shows"
          seeMoreHref="/discover/series"
          cards={trendingTv.map((m, i) => ({
            key: `tt-${m.id}`,
            poster_path: m.poster_path,
            title: m.title || m.name || "Untitled",
            rank: i + 1,
            meta: m.vote_average ? m.vote_average.toFixed(1) : undefined,
            onClick: () => handleTrendingInfoClick({ ...m, media_type: "tv" }),
          }))}
        />
      </div>
      {/* ── Ad-Free Guide ── */}
            <section className="bg-black px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Best Experience
            </div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              Watch completely ad-free
            </h2>
            <p className="mt-2 text-sm text-white/50">
              BigFlix is free — but the player embeds may show ads. Kill them in 60 seconds.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Brave */}
            <SpotlightCard
              className="border-white/10 bg-linear-to-br from-[#1a1210] to-[#1a0f0a]"
              spotlightColor="rgba(251, 115, 22, 0.22)"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20">
                    <Download className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Option 1 — Brave Browser</h3>
                    <p className="text-xs text-white/50">Built-in ad & tracker blocker, zero setup</p>
                  </div>
                </div>
                <ol className="space-y-2 text-sm text-white/70">
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-orange-400">1.</span>Go to <span className="font-semibold text-white">brave.com</span> and download Brave Browser.</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-orange-400">2.</span>Install and open it — ads are already blocked by default.</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-orange-400">3.</span>Head back to BigFlix and enjoy a clean, uninterrupted experience.</li>
                </ol>
                <a
                  href="https://brave.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-md bg-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-300 transition-colors hover:bg-orange-500/30"
                >
                  Download Brave
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </SpotlightCard>

            {/* uBlock Origin */}
            <SpotlightCard
              className="border-white/10 bg-linear-to-br from-[#0d1a12] to-[#0a1a10]"
              spotlightColor="rgba(34, 197, 94, 0.2)"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/20">
                    <Zap className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Option 2 — uBlock Origin</h3>
                    <p className="text-xs text-white/50">Lightweight extension, works on any browser</p>
                  </div>
                </div>
                <ol className="space-y-2 text-sm text-white/70">
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-green-400">1.</span>Open Chrome, Firefox, or Edge and go to your browser&apos;s extension store.</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-green-400">2.</span>Search for <span className="font-semibold text-white">uBlock Origin</span> and click <span className="font-semibold text-white">Add to browser</span>.</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-green-400">3.</span>Done. Every ad across BigFlix and the rest of the web is now blocked.</li>
                </ol>
                <a
                  href="https://ublockorigin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-md bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30"
                >
                  Get uBlock Origin
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>
      {/* ── More Reasons to Join ── */}
      {/* <section className="bg-black px-6 py-16 md:px-12">
        <h2 className="mb-10 text-center text-xl font-bold text-white md:text-2xl">
          More Reasons to Join
        </h2>
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </section> */}



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
        <p className="text-sm text-white/40">
          built by Biggy using 🌿
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm">
          <a
            href="https://github.com/biggymarley"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 transition-colors hover:text-white"
          >
            GitHub
          </a>
          <span className="text-white/20">|</span>
          <a
            href="https://www.instagram.com/bbigggyy/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 transition-colors hover:text-white"
          >
            Instagram
          </a>
        </div>
      </footer>

      <InfoModal
        movie={selectedMovie}
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />
    </div>
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
