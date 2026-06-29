"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Users,
  Cpu,
  Download,
  Upload,
  HardDrive,
  Clock,
  RefreshCw,
} from "lucide-react";

interface TorrentRow {
  name: string;
  infoHash: string;
  peers: number;
  progressPct: number;
  downloadedMB: number;
  downloadMbps: number;
  activeStreams: number;
}

interface Stats {
  uptimeSec: number;
  memoryMB: number;
  viewers: number;
  byMode: { direct: number; remux: number; transcode: number };
  totals: { torrents: number; downloadMbps: number; uploadMbps: number };
  torrents: TorrentRow[];
}

const BASE = process.env.NEXT_PUBLIC_TORRENT_BASE_URL;
const TOKEN = process.env.NEXT_PUBLIC_TORRENT_TOKEN;

function fmtUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function peerColor(n: number) {
  return n >= 20 ? "text-green-400" : n >= 5 ? "text-amber-400" : "text-red-400";
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!BASE) {
      setOnline(false);
      return;
    }
    try {
      const res = await fetch(`${BASE}/stats?token=${TOKEN}`, { signal, cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Stats;
      setStats(data);
      setOnline(true);
      setLastUpdated(Date.now());
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setOnline(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    timer.current = setInterval(() => load(), 3000);
    const ageTimer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      ctrl.abort();
      if (timer.current) clearInterval(timer.current);
      clearInterval(ageTimer);
    };
  }, [load]);

  const ageSec = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null;
  // tick keeps the "Xs ago" label fresh
  void tick;

  const transcodeHot = (stats?.byMode.transcode ?? 0) >= 3;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Activity className="h-6 w-6 text-primary" />
              Torrent Server
            </h1>
            <p className="mt-1 text-sm text-white/40">{BASE || "no backend configured"}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
                online === null
                  ? "bg-white/10 text-white/60"
                  : online
                    ? "bg-green-500/15 text-green-400"
                    : "bg-red-500/15 text-red-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  online === null ? "bg-white/40" : online ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
              {online === null ? "Connecting…" : online ? "Online" : "Offline"}
            </span>
            {ageSec !== null && online && (
              <span className="flex items-center gap-1 text-white/40">
                <RefreshCw className="h-3 w-3" /> {ageSec}s ago
              </span>
            )}
          </div>
        </div>

        {online === false && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
            Can&apos;t reach the server. Check the box is up, the token, and that this origin is in
            the backend&apos;s <code>ALLOWED_ORIGINS</code>.
          </div>
        )}

        {stats && (
          <>
            {/* Top stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat icon={<Users className="h-4 w-4" />} label="Viewers" value={stats.viewers} />
              <Stat
                icon={<Cpu className="h-4 w-4" />}
                label="Transcodes"
                value={stats.byMode.transcode}
                tone={transcodeHot ? "bad" : stats.byMode.transcode > 0 ? "warn" : "ok"}
              />
              <Stat
                icon={<Download className="h-4 w-4" />}
                label="Download"
                value={`${stats.totals.downloadMbps}`}
                unit="Mbps"
              />
              <Stat
                icon={<Upload className="h-4 w-4" />}
                label="Upload"
                value={`${stats.totals.uploadMbps}`}
                unit="Mbps"
              />
              <Stat icon={<HardDrive className="h-4 w-4" />} label="Memory" value={stats.memoryMB} unit="MB" />
              <Stat icon={<Clock className="h-4 w-4" />} label="Uptime" value={fmtUptime(stats.uptimeSec)} />
            </div>

            {/* Mode breakdown */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Pill label="Direct (MP4)" value={stats.byMode.direct} tone="ok" />
              <Pill label="Remux (MKV)" value={stats.byMode.remux} tone="warn" />
              <Pill label="Transcode (HEVC)" value={stats.byMode.transcode} tone={transcodeHot ? "bad" : "warn"} />
              {transcodeHot && (
                <span className="rounded-full bg-red-500/15 px-2.5 py-1 font-medium text-red-300">
                  ⚠ heavy transcode load
                </span>
              )}
            </div>

            {/* Torrents table */}
            <h2 className="mt-8 mb-3 text-sm font-semibold text-white/70">
              Active titles ({stats.torrents.length})
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/10">
              {stats.torrents.length === 0 ? (
                <div className="p-8 text-center text-sm text-white/40">No active streams right now.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-white/40">
                      <th className="px-4 py-2.5 font-medium">Title</th>
                      <th className="px-3 py-2.5 text-right font-medium">Peers</th>
                      <th className="px-3 py-2.5 text-right font-medium">Progress</th>
                      <th className="px-3 py-2.5 text-right font-medium">Down</th>
                      <th className="px-3 py-2.5 text-right font-medium">↓ Mbps</th>
                      <th className="px-3 py-2.5 text-right font-medium">Viewers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.torrents.map((t) => (
                      <tr key={t.infoHash} className="border-b border-white/5 last:border-0">
                        <td className="max-w-0 truncate px-4 py-2.5 text-white/80" title={t.name}>
                          {t.name || t.infoHash.slice(0, 12)}
                        </td>
                        <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${peerColor(t.peers)}`}>
                          {t.peers}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/60">{t.progressPct}%</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/60">{t.downloadedMB} MB</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/60">{t.downloadMbps}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/80">{t.activeStreams}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  tone = "ok",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const toneClass =
    tone === "bad" ? "text-red-400" : tone === "warn" ? "text-amber-400" : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-xs text-white/40">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-white/40">{unit}</span>}
      </div>
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "bad" }) {
  const toneClass =
    tone === "bad"
      ? "bg-red-500/10 text-red-300"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-300"
        : "bg-green-500/10 text-green-300";
  return (
    <span className={`rounded-full px-2.5 py-1 font-medium ${toneClass}`}>
      {label}: {value}
    </span>
  );
}
