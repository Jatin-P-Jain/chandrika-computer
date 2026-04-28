"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { DayNavigator } from "@/components/custom/date-navigator";
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/hooks/useSafeRouter";

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DailyAccountDayNavigator({ docId }: { docId: string }) {
  const { push } = useSafeRouter();
  const searchParams = useSearchParams();

  // Parse docId -> Date (expects yyyy-MM-dd)
  const selected = React.useMemo(() => {
    const parsed = parseISO(docId);
    return isValid(parsed) ? toDateOnly(parsed) : toDateOnly(new Date());
  }, [docId]);

  const onChange = (d: Date) => {
    const next = toDateOnly(d);
    const nextDocId = format(next, "yyyy-MM-dd");
    const mode = searchParams.get("mode");
    const nextUrl = mode
      ? `/daily-accounts/${nextDocId}?mode=${mode}`
      : `/daily-accounts/${nextDocId}`;

    push(nextUrl, { scroll: false });
  };

  return <DayNavigator value={selected} onChange={onChange} />;
}
