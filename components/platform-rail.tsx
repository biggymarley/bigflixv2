"use client";

import Image from "next/image";
import Link from "next/link";
import { PLATFORMS } from "@/lib/platforms";
import { imageUrl } from "@/lib/tmdb";

export default function PlatformRail() {
  return (
    <section className="relative z-10 bg-black px-6 py-10 md:px-12">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.3em] text-white/40">
        Browse by platform
      </p>

      <div className="flex flex-wrap items-start justify-center gap-x-5 gap-y-6 py-2 md:gap-x-8">
        {PLATFORMS.map((platform) => (
          <Link
            key={platform.slug}
            href={`/platform/${platform.slug}`}
            className="group flex shrink-0 flex-col items-center gap-2"
            title={platform.name}
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/60 group-hover:shadow-xl group-hover:shadow-primary/25 md:h-24 md:w-24">
              <Image
                src={imageUrl(platform.logoPath, "w300")}
                alt={platform.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <span className="text-xs font-medium text-white/60 transition-colors group-hover:text-white">
              {platform.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
