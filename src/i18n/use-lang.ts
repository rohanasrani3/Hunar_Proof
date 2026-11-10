"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./employer";

const KEY = "hunarproof.lang";

/** Per-viewer language preference; storage may be unavailable, so never rely on it. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "hi" || saved === "en") setLang(saved);
    } catch {}
  }, []);
  const update = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  };
  return [lang, update];
}
