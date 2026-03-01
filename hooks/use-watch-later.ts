"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import type { WatchLaterItem } from "@/lib/types";

const COOKIE_KEY = "bigflix-watch-later";

function getItems(): WatchLaterItem[] {
  try {
    const raw = Cookies.get(COOKIE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: WatchLaterItem[]) {
  Cookies.set(COOKIE_KEY, JSON.stringify(items), { expires: 365, path: "/" });
}

export function useWatchLater() {
  const [items, setItems] = useState<WatchLaterItem[]>([]);

  useEffect(() => {
    setItems(getItems());
  }, []);

  const addItem = useCallback((item: WatchLaterItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      const next = [...prev, item];
      saveItems(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveItems(next);
      return next;
    });
  }, []);

  const isInList = useCallback(
    (id: number) => items.some((i) => i.id === id),
    [items]
  );

  return { items, addItem, removeItem, isInList };
}
