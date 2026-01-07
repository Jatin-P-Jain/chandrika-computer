// hooks/use-breakpoints.ts
"use client";

import { useEffect, useMemo, useState } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

export function useBreakpoints() {
  const queries = useMemo(() => {
    const entries = Object.entries(BREAKPOINTS) as [BreakpointKey, number][];
    return entries.map(([key, px]) => [key, `(min-width: ${px}px)`] as const);
  }, []);

  const [matches, setMatches] = useState<Record<BreakpointKey, boolean>>({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    "2xl": false,
  });

  useEffect(() => {
    const mqls = queries.map(([key, query]) => [key, window.matchMedia(query)] as const);

    const update = () => {
      setMatches({
        sm: mqls.find(([k]) => k === "sm")![1].matches,
        md: mqls.find(([k]) => k === "md")![1].matches,
        lg: mqls.find(([k]) => k === "lg")![1].matches,
        xl: mqls.find(([k]) => k === "xl")![1].matches,
        "2xl": mqls.find(([k]) => k === "2xl")![1].matches,
      });
    };

    update();

    mqls.forEach(([, mql]) => mql.addEventListener("change", update));
    return () => mqls.forEach(([, mql]) => mql.removeEventListener("change", update));
  }, [queries]);

  return {
    ...matches,

    // handy aliases
    isMobile: !matches.md,
    isTabletUp: matches.md,
    isDesktopUp: matches.lg,
  };
}
