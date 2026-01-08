"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import { DayNavigator } from "@/components/custom/date-navigator";

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DailyAccountDayNavigator({ docId }: { docId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse docId -> Date (expects yyyy-MM-dd)
  const selected = React.useMemo(() => {
    const parsed = parseISO(docId);
    return isValid(parsed) ? toDateOnly(parsed) : toDateOnly(new Date());
  }, [docId]);

  const mode = searchParams.get("mode"); // keep mode while navigating if needed

  const onChange = (d: Date) => {
    const next = toDateOnly(d);
    const nextDocId = format(next, "yyyy-MM-dd");

    router.push(`/daily-accounts/${nextDocId}`, { scroll: false });
  };

  return <DayNavigator value={selected} onChange={onChange} />;
}
