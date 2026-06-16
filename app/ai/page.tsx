"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Baby,
  Bookmark,
  BookmarkCheck,
  Brain,
  Clapperboard,
  Coffee,
  Compass,
  Dices,
  Film,
  Flame,
  Ghost,
  Heart,
  HeartHandshake,
  Laugh,
  Loader2,
  Moon,
  Play,
  Popcorn,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Sparkles,
  Star,
  TrendingUp,
  Tv,
  Users,
  type LucideIcon,
} from "lucide-react";
import Header from "@/components/header";
import InfoModal from "@/components/info-modal";
import { Button } from "@/components/ui/button";
import { useWatchLater } from "@/hooks/use-watch-later";
import type { Movie } from "@/lib/types";
import { imageUrl, isImageMissing } from "@/lib/tmdb";

type QuestionId = "format" | "mood" | "company" | "genre" | "discovery";

type Option = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type Question = {
  id: QuestionId;
  title: string;
  subtitle: string;
};

type AnswerState = Record<QuestionId, string>;

type Recommendation = {
  id: number;
  type: "movie" | "tv";
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  year: string | null;
  reason: string;
};

const QUESTIONS: Question[] = [
  {
    id: "format",
    title: "What are you in the mood for?",
    subtitle: "A one-night story or something to sink into.",
  },
  {
    id: "mood",
    title: "What kind of experience?",
    subtitle: "How do you want to feel by the end.",
  },
  {
    id: "company",
    title: "Who's watching tonight?",
    subtitle: "We'll keep the picks right for the room.",
  },
  {
    id: "genre",
    title: "Pick a flavor",
    subtitle: "Your lean for tonight — not a life commitment.",
  },
  {
    id: "discovery",
    title: "How should it feel to find?",
    subtitle: "From comfort watches to deep cuts.",
  },
];

const OPTIONS: Record<QuestionId, Option[]> = {
  format: [
    { value: "movie", label: "A movie", description: "One and done", icon: Film },
    { value: "tv", label: "A series", description: "Something to binge", icon: Tv },
    { value: "either", label: "Either works", description: "Surprise me", icon: Shuffle },
  ],
  mood: [
    { value: "cozy", label: "Cozy & comforting", description: "Easy, warm, low stakes", icon: Coffee },
    { value: "funny", label: "Make me laugh", description: "Light and fun", icon: Laugh },
    { value: "thrilling", label: "Edge of my seat", description: "Tense and gripping", icon: Flame },
    { value: "mindbending", label: "Mind-bending", description: "Make me think", icon: Brain },
    { value: "emotional", label: "Emotional & moving", description: "Hit me in the feels", icon: Heart },
    { value: "dark", label: "Dark & gritty", description: "Moody and intense", icon: Moon },
  ],
  company: [
    { value: "solo", label: "Just me", description: "Anything goes", icon: Coffee },
    { value: "partner", label: "Date night", description: "Shared, easy vibe", icon: HeartHandshake },
    { value: "family", label: "Family & kids", description: "Keep it safe", icon: Baby },
    { value: "friends", label: "Friends hangout", description: "Fun for the group", icon: Users },
  ],
  genre: [
    { value: "action", label: "Action", description: "Big and kinetic", icon: Flame },
    { value: "comedy", label: "Comedy", description: "Laughs first", icon: Laugh },
    { value: "drama", label: "Drama", description: "Character-driven", icon: Clapperboard },
    { value: "scifi_fantasy", label: "Sci-fi / Fantasy", description: "Other worlds", icon: Sparkles },
    { value: "thriller_horror", label: "Thriller / Horror", description: "Keep me on edge", icon: Ghost },
    { value: "romance", label: "Romance", description: "Matters of the heart", icon: Heart },
    { value: "surprise", label: "Surprise me", description: "No preference", icon: Dices },
  ],
  discovery: [
    { value: "popular", label: "Crowd-pleasers", description: "Loved by everyone", icon: TrendingUp },
    { value: "hidden", label: "Hidden gems", description: "Underrated picks", icon: Compass },
    { value: "acclaimed", label: "Critically acclaimed", description: "Award-winning", icon: Award },
    { value: "surprise", label: "Surprise me", description: "Wildcard", icon: Dices },
  ],
};

function labelFor(id: QuestionId, value?: string) {
  return OPTIONS[id].find((option) => option.value === value)?.label;
}

function gridClassFor(count: number) {
  if (count <= 3) return "grid-cols-1 sm:grid-cols-3";
  if (count === 4) return "grid-cols-2 lg:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-3";
}

export default function AiPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<AnswerState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { addItem, isInList } = useWatchLater();

  const activeQuestion = QUESTIONS[currentStep];
  const activeOptions = activeQuestion ? OPTIONS[activeQuestion.id] : [];
  const hasResults = recommendations.length > 0;

  const vibeSummary = useMemo(() => {
    return [
      labelFor("mood", answers.mood),
      labelFor("genre", answers.genre),
      labelFor("company", answers.company),
    ]
      .filter(Boolean)
      .join(" · ");
  }, [answers.mood, answers.genre, answers.company]);

  const runRecommendations = async (nextAnswers: Partial<AnswerState>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextAnswers),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not get recommendations.");
      }
      setRecommendations(data.recommendations || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (value: string) => {
    if (!activeQuestion || loading) return;
    const nextAnswers = { ...answers, [activeQuestion.id]: value };
    setAnswers(nextAnswers);
    setError(null);

    const isLastQuestion = currentStep === QUESTIONS.length - 1;
    if (isLastQuestion) {
      void runRecommendations(nextAnswers);
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const goBack = () => {
    if (currentStep === 0 || loading) return;
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendations([]);
    setReplacingIndex(null);
    setError(null);
    setLoading(false);
  };

  const refineAnswers = () => {
    setRecommendations([]);
    setReplacingIndex(null);
    setError(null);
    setCurrentStep(QUESTIONS.length - 1);
  };

  const watchHref = (item: Recommendation) =>
    item.type === "tv"
      ? `/watch/${item.id}?type=tv&se=1&ep=1`
      : `/watch/${item.id}?type=movie`;

  const openInfo = (item: Recommendation) =>
    setSelectedMovie({
      id: item.id,
      media_type: item.type,
      title: item.type === "movie" ? item.title : undefined,
      name: item.type === "tv" ? item.title : undefined,
      overview: item.overview || "",
      poster_path: item.poster_path,
      backdrop_path: null,
      vote_average: item.vote_average || 0,
      vote_count: 0,
      popularity: 0,
      release_date:
        item.type === "movie" && item.year ? `${item.year}-01-01` : undefined,
      first_air_date:
        item.type === "tv" && item.year ? `${item.year}-01-01` : undefined,
    });

  const refindRecommendation = async (index: number) => {
    if (loading || replacingIndex !== null) return;
    setReplacingIndex(index);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not refind a recommendation.");
      }

      const nextList = (data.recommendations || []) as Recommendation[];
      const currentItem = recommendations[index];
      const replacement = nextList.find(
        (candidate) =>
          !(
            currentItem &&
            candidate.id === currentItem.id &&
            candidate.type === currentItem.type
          ) &&
          !recommendations.some(
            (existing, existingIndex) =>
              existingIndex !== index &&
              existing.id === candidate.id &&
              existing.type === candidate.type
          )
      );

      if (!replacement) {
        throw new Error("Could not find a different recommendation. Try again.");
      }

      setRecommendations((prev) =>
        prev.map((item, itemIndex) => (itemIndex === index ? replacement : item))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not replace recommendation.";
      setError(message);
    } finally {
      setReplacingIndex(null);
    }
  };

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-16 pt-24 md:px-8">
        {/* Red → black → red ambient wash */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-primary/25 via-black to-primary/20" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(229,9,20,0.22),transparent_70%)]" />

        <div className="relative z-10 mx-auto w-full max-w-5xl">
          {/* Intro */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Movie Match
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Find what to watch{" "}
              <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
                in seconds
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/60 md:text-base">
              Answer {QUESTIONS.length} quick questions. Get 3 picks made for
              your exact mood tonight.
            </p>
          </div>

          {/* ── Question flow ── */}
          {!hasResults && !loading && activeQuestion && (
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl md:p-8">
              {/* progress */}
              <div className="mb-7 flex items-center gap-3">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Previous question"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="flex flex-1 items-center gap-1.5">
                  {QUESTIONS.map((q, i) => (
                    <div
                      key={q.id}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i < currentStep
                          ? "bg-primary"
                          : i === currentStep
                          ? "bg-primary/60"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums text-white/50">
                  {currentStep + 1}/{QUESTIONS.length}
                </span>
              </div>

              {/* question */}
              <div key={activeQuestion.id} className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  {activeQuestion.title}
                </h2>
                <p className="mt-1.5 text-sm text-white/50">
                  {activeQuestion.subtitle}
                </p>

                <div className={`mt-6 grid gap-3 ${gridClassFor(activeOptions.length)}`}>
                  {activeOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = answers[activeQuestion.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleAnswer(option.value)}
                        className={`group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                            selected
                              ? "bg-primary text-white"
                              : "bg-white/10 text-primary group-hover:bg-white/15"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-white">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-white/50">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 flex flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm font-medium text-white">
                  Curating your 3 picks{vibeSummary ? "…" : "…"}
                </p>
                {vibeSummary && (
                  <p className="text-xs text-white/50">{vibeSummary}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                  >
                    <div className="aspect-2/3 w-full animate-pulse bg-white/10" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-full animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {hasResults && !loading && (
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Popcorn className="h-4 w-4" />
                    Your 3 picks for tonight
                  </div>
                  {vibeSummary && (
                    <p className="mt-1 text-sm text-white/50">
                      Because you wanted{" "}
                      <span className="text-white/80">{vibeSummary}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 text-white hover:bg-white/20"
                    onClick={refineAnswers}
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Tweak answers
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 text-white hover:bg-white/20"
                    onClick={resetFlow}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Start over
                  </Button>
                </div>
              </div>

              {error && (
                <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {recommendations.map((item, index) => {
                  const saved = isInList(item.id);
                  const missing = isImageMissing(item.poster_path);
                  return (
                    <article
                      key={`${item.type}-${item.id}`}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-lg shadow-black/50 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20"
                    >
                      <div className="relative">
                        {missing ? (
                          <div className="aspect-2/3 w-full bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl(item.poster_path)}
                            alt={item.title}
                            className="aspect-2/3 w-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {missing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-3 text-center text-xs font-semibold text-white">
                            Image not available
                          </div>
                        )}

                        {/* meta badges */}
                        <div className="absolute left-2 top-2 flex items-center gap-1.5">
                          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                            {item.type === "tv" ? "Series" : "Movie"}
                          </span>
                          {item.vote_average > 0 && (
                            <span className="flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur">
                              <Star className="h-3 w-3 fill-amber-300" />
                              {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* swap */}
                        <button
                          type="button"
                          onClick={() => refindRecommendation(index)}
                          disabled={replacingIndex !== null}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-black/70 text-white backdrop-blur transition-colors hover:bg-black/90 disabled:cursor-not-allowed"
                          aria-label="Swap this pick"
                          title="Swap this pick"
                        >
                          {replacingIndex === index ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </button>

                        {replacingIndex === index && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium text-white">
                            Finding another pick…
                          </div>
                        )}
                      </div>

                      <div className="relative flex flex-1 flex-col gap-3 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-4">
                        <div>
                          <h3 className="line-clamp-1 text-base font-semibold text-white">
                            {item.title}
                          </h3>
                          <p className="text-xs text-white/45">
                            {item.year || "—"}
                          </p>
                        </div>
                        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-white/80">
                          <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />
                          {item.reason}
                        </p>

                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            className="col-span-2"
                            onClick={() => router.push(watchHref(item))}
                          >
                            <Play className="mr-1.5 h-4 w-4 fill-current" />
                            Watch now
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/10 text-white hover:bg-white/20"
                            onClick={() => openInfo(item)}
                          >
                            <Clapperboard className="mr-1.5 h-4 w-4" />
                            Trailer
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
                            onClick={() => addItem({ id: item.id, type: item.type })}
                            disabled={saved}
                          >
                            {saved ? (
                              <>
                                <BookmarkCheck className="mr-1.5 h-4 w-4 text-primary" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Bookmark className="mr-1.5 h-4 w-4" />
                                Later
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <InfoModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </>
  );
}
