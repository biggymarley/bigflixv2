"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import type { WatchHistoryItem } from "@/lib/types";

const COOKIE_KEY = "bigflix-watch-history";
const MAX_HISTORY_ITEMS = 60;

function getItems(): WatchHistoryItem[] {
  try {
    const raw = Cookies.get(COOKIE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WatchHistoryItem[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.id === "number" &&
        (item?.type === "movie" || item?.type === "tv") &&
        typeof item?.watchedAt === "number"
    );
  } catch {
    return [];
  }
}

function saveItems(items: WatchHistoryItem[]) {
  Cookies.set(COOKIE_KEY, JSON.stringify(items), { expires: 365, path: "/" });
}

type AddHistoryInput = Omit<WatchHistoryItem, "watchedAt">;

export function useWatchHistory() {
  const [items, setItems] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setItems(getItems());
  }, []);

  const addItem = useCallback((item: AddHistoryInput) => {
    setItems((prev) => {
      const now = Date.now();
      const nextItem: WatchHistoryItem = { ...item, watchedAt: now };
      const deduped = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      const next = [nextItem, ...deduped].slice(0, MAX_HISTORY_ITEMS);
      saveItems(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    saveItems([]);
    setItems([]);
  }, []);

  return { items, addItem, clearHistory };
}
