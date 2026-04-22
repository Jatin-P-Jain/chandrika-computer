"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { DayNavigator } from "@/components/custom/date-navigator";
import { useSafeRouter } from "@/hooks/useSafeRouter";

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DailyAccountDayNavigator({ docId }: { docId: string }) {
  const { push } = useSafeRouter();

  // Parse docId -> Date (expects yyyy-MM-dd)
  const selected = React.useMemo(() => {
    const parsed = parseISO(docId);
    return isValid(parsed) ? toDateOnly(parsed) : toDateOnly(new Date());
  }, [docId]);

  const onChange = (d: Date) => {
    const next = toDateOnly(d);
    const nextDocId = format(next, "yyyy-MM-dd");

    push(`/daily-accounts/${nextDocId}`, { scroll: false });
  };

  return <DayNavigator value={selected} onChange={onChange} />;
}
