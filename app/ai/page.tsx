"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Header from "@/components/header";
import InfoModal from "@/components/info-modal";
import PixelBlast from "@/components/PixelBlast";
import FuzzyText from "@/components/FuzzyText";
import { Button } from "@/components/ui/button";
import { useWatchLater } from "@/hooks/use-watch-later";
import type { Movie } from "@/lib/types";
import { imageUrl, isImageMissing } from "@/lib/tmdb";

type Question = {
  id: "mood" | "pace" | "format" | "genre";
  title: string;
  options: { value: string; label: string }[];
};

type AnswerState = Record<Question["id"], string>;

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
    id: "mood",
    title: "What mood are you in right now?",
    options: [
      { value: "cozy", label: "Cozy and comfort" },
      { value: "uplifting", label: "Uplifting and light" },
      { value: "adventurous", label: "Adventurous and fun" },
      { value: "intense", label: "Dark and intense" },
    ],
  },
  {
    id: "pace",
    title: "How fast should it feel?",
    options: [
      { value: "slow", label: "Slow burn" },
      { value: "balanced", label: "Balanced pace" },
      { value: "fast", label: "Fast and thrilling" },
    ],
  },
  {
    id: "format",
    title: "What do you want to watch?",
    options: [
      { value: "movie", label: "Movie night" },
      { value: "tv", label: "Series binge" },
      { value: "either", label: "Either works" },
    ],
  },
  {
    id: "genre",
    title: "Pick a genre vibe",
    options: [
      { value: "action", label: "Action" },
      { value: "comedy", label: "Comedy" },
      { value: "drama", label: "Drama" },
      { value: "scifi_fantasy", label: "Sci-fi / Fantasy" },
      { value: "thriller_horror", label: "Thriller / Horror" },
      { value: "surprise", label: "Surprise me" },
    ],
  },
];

export default function AiPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<AnswerState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { addItem, isInList } = useWatchLater();

  const activeQuestion = QUESTIONS[currentStep];
  const progress = useMemo(
    () => Math.round((currentStep / QUESTIONS.length) * 100),
    [currentStep]
  );

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
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
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
    setRecommendations([]);

    const isLastQuestion = currentStep === QUESTIONS.length - 1;
    if (isLastQuestion) {
      void runRecommendations(nextAnswers);
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendations([]);
    setReplacingIndex(null);
    setError(null);
    setLoading(false);
  };

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
      <main className="relative min-h-screen bg-black px-6 py-12 pt-24 md:px-12">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-75">
          <PixelBlast
            className="h-full w-full"
            color="#ff2b2b"
            variant="square"
            pixelSize={3}
            patternScale={2.2}
            patternDensity={1}
            enableRipples={false}
            speed={0.45}
            edgeFade={0.35}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <section className="relative w-full p-6 text-center">
            <FuzzyText
              className="mx-auto max-w-[16ch] leading-tight sm:max-w-none"
              fontSize="clamp(1.6rem, 8vw, 4rem)"
              fontWeight={800}
              color="#ffffff"
              baseIntensity={0.08}
              hoverIntensity={0.25}
            >
              Find what to watch faster
            </FuzzyText>

            <div className="mx-auto mt-8 w-full px-4">
              {recommendations.length === 0 && (
                <div className="mx-auto max-w-7xl space-y-6 rounded-xl border border-white/10 bg-black p-6">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Question {Math.min(currentStep + 1, QUESTIONS.length)} of{" "}
                      {QUESTIONS.length}
                    </p>
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {activeQuestion && (
                    <>
                      <h2 className="text-xl font-semibold text-white md:text-2xl">
                        {activeQuestion.title}
                      </h2>
                      <div className="grid gap-3">
                        {activeQuestion.options.map((option) => (
                          <Button
                            key={option.value}
                            variant="secondary"
                            className="h-11 justify-start rounded-none bg-white/10 text-left text-white hover:bg-white/20"
                            onClick={() => handleAnswer(option.value)}
                            disabled={loading}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gemini is finding your top 3 picks...
                    </div>
                  )}

                  {error && (
                    <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                      {error}
                    </p>
                  )}
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="mx-auto max-w-7xl space-y-4 rounded-xl border border-white/10 bg-black/60 p-6 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles className="h-4 w-4" />
                    Your 3 mood picks
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {recommendations.map((item, index) => (
                      <article
                        key={`${item.type}-${item.id}`}
                        className="overflow-hidden rounded-lg border border-white/10 bg-black/50"
                      >
                        <div className="group/poster relative">
                          {isImageMissing(item.poster_path) ? (
                            <div className="aspect-2/3 w-full bg-[url('/bigflix.png')] bg-repeat bg-size-[120px_auto]" />
                          ) : (
                            <img
                              src={imageUrl(item.poster_path)}
                              alt={item.title}
                              className="aspect-2/3 w-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {isImageMissing(item.poster_path) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-3 text-center text-xs font-semibold text-white">
                              Image not available
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => refindRecommendation(index)}
                            disabled={replacingIndex !== null}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-3 text-center text-xs font-medium text-white opacity-0 transition-opacity group-hover/poster:opacity-100 disabled:cursor-not-allowed"
                          >
                            {replacingIndex === index ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Finding another pick...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-5 w-5" />
                                Refind something else
                              </>
                            )}
                          </button>
                        </div>
                        <div className="space-y-2 p-3">
                          <h3 className="line-clamp-1 text-sm font-semibold text-white">
                            {item.title}
                          </h3>
                          <p className="line-clamp-2 text-xs text-white/70">
                            {item.reason}
                          </p>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-white/60">
                            <span className="uppercase">{item.type}</span>
                            <span>{item.year || "N/A"}</span>
                          </div>
                          <Button
                            size="sm"
                            className="mt-1 w-full rounded-none"
                            onClick={() =>
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
                                  item.type === "movie" && item.year
                                    ? `${item.year}-01-01`
                                    : undefined,
                                first_air_date:
                                  item.type === "tv" && item.year
                                    ? `${item.year}-01-01`
                                    : undefined,
                              })
                            }
                          >
                            Check trailer
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full rounded-none bg-white/10 text-white hover:bg-white/20"
                            onClick={() =>
                              addItem({ id: item.id, type: item.type })
                            }
                            disabled={isInList(item.id)}
                          >
                            Watch Later
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-none border border-white/20 bg-white/10 text-white hover:bg-white/20"
                      onClick={resetFlow}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </section>
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
