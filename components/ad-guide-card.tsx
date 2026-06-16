import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import SpotlightCard from "@/components/SpotlightCard";

interface AdGuideCardProps {
  iconSrc: string;
  iconAlt: string;
  title: string;
  subtitle: ReactNode;
  steps: ReactNode[];
  href: string;
  ctaLabel: string;
}

/** A single "block ads" how-to card used in the home page's Ad-Free Guide. */
export default function AdGuideCard({
  iconSrc,
  iconAlt,
  title,
  subtitle,
  steps,
  href,
  ctaLabel,
}: AdGuideCardProps) {
  return (
    <SpotlightCard
      className="border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
      spotlightColor="rgba(255, 255, 255, 0.08)"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 p-2 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc} alt={iconAlt} className="h-full w-full" />
          </div>
          <div>
            <h3 className="font-bold text-white">{title}</h3>
            <p className="text-xs text-white/50">{subtitle}</p>
          </div>
        </div>
        <ol className="space-y-2 text-sm text-white/70">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 font-bold text-primary">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          {ctaLabel}
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </SpotlightCard>
  );
}
