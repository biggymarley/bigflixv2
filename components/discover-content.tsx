"use client";

import { useState } from "react";
import MovieSlider from "@/components/movie-slider";
import InfoModal from "@/components/info-modal";
import type { Movie, SliderMode } from "@/lib/types";

interface DiscoverContentProps {
  modes: SliderMode[];
}

export default function DiscoverContent({ modes }: DiscoverContentProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <div className="space-y-8 pb-12">
      {modes.map((mode) => (
        <MovieSlider
          key={mode.id}
          mode={mode}
          onInfoClick={setSelectedMovie}
        />
      ))}

      <InfoModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}
