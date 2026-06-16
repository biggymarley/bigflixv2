"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ChevronRight, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bigflix-adblock-notice-v1";

export default function AdNoticeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    if (!seen) {
      // Small delay so the entrance animation reads after the page paints.
      const t = setTimeout(() => setOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent
        showCloseButton
        className="max-w-lg overflow-hidden border-white/10 bg-gradient-to-b from-[#15131c] to-[#0b0b0f] p-0 text-left shadow-2xl"
      >
        {/* Glow header band */}
        <div className="relative overflow-hidden px-6 pb-2 pt-7">
          <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-primary/25 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-white duration-500 animate-in fade-in slide-in-from-bottom-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Before you start
            </div>

            <DialogTitle className="text-2xl font-extrabold tracking-tight text-white duration-500 animate-in fade-in slide-in-from-bottom-2">
              Watch ad-free in under a minute
            </DialogTitle>

            <DialogDescription className="mt-2 text-sm leading-relaxed text-white/60 duration-500 animate-in fade-in slide-in-from-bottom-2">
              BigFlix is completely free. The only ads you may see come from the
              third-party <span className="text-white/80">video players</span> —
              not from us. Block them with either option below for a clean,
              uninterrupted experience.
            </DialogDescription>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 px-6 pb-3 pt-2">
          {/* uBlock Origin */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05] delay-100 duration-500 animate-in fade-in slide-in-from-bottom-3">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 p-1.5 ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ublock-origin.svg"
                  alt="uBlock Origin"
                  className="h-full w-full"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Option 1 — uBlock Origin
                </h3>
                <p className="text-xs text-white/45">
                  Free extension, works on any browser
                </p>
              </div>
            </div>
            <ol className="space-y-1.5 text-[13px] text-white/70">
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">1.</span>
                Open your browser&apos;s extension store (Chrome, Firefox, Edge).
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">2.</span>
                Search <span className="font-semibold text-white">uBlock Origin</span>{" "}
                and click <span className="font-semibold text-white">Add</span>.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">3.</span>
                Refresh BigFlix — ads are gone.
              </li>
            </ol>
            <a
              href="https://ublockorigin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              Get uBlock Origin
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Brave */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05] delay-200 duration-500 animate-in fade-in slide-in-from-bottom-3">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 p-1.5 ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brave.svg" alt="Brave" className="h-full w-full" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Option 2 — Brave Browser
                </h3>
                <p className="text-xs text-white/45">
                  Built-in blocker, zero setup
                </p>
              </div>
            </div>
            <ol className="space-y-1.5 text-[13px] text-white/70">
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">1.</span>
                Download Brave from{" "}
                <span className="font-semibold text-white">brave.com</span>.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">2.</span>
                Install and open it — ads are blocked by default.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">3.</span>
                Visit BigFlix and enjoy the show.
              </li>
            </ol>
            <a
              href="https://brave.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              Download Brave
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 delay-300 duration-500 animate-in fade-in">
          <Button onClick={dismiss} className="w-full gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Got it, let&apos;s watch
          </Button>
          <p className="mt-3 text-center text-[11px] text-white/35">
            This message won&apos;t show again.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
