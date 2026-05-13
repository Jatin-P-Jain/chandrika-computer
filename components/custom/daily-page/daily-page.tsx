"use client";

import dynamic from "next/dynamic";
import { DailyFormValues } from "@/schema/daily-page.schema";
import { DailyAccount } from "@/types/daily-account";
import { PhotocopyReadingDoc, StampReadingDoc } from "@/types/readings";

const DailyPageReadOnly = dynamic(() => import("./daily-page-read-only"), {
  loading: () => (
    <div className="w-full min-h-[60vh] animate-pulse rounded-md border bg-muted/20" />
  ),
});

const DailyPageEditor = dynamic(() => import("./daily-page-editor"), {
  loading: () => (
    <div className="w-full min-h-[60vh] animate-pulse rounded-md border bg-muted/20" />
  ),
});

type DailyPageMode = "create" | "view" | "edit";

type DailyPageProps = {
  mode: DailyPageMode;
  initialData?: DailyFormValues;
  dailyItemData?: DailyAccount;
  docId: string;
  readings?: {
    success: boolean;
    photocopy: PhotocopyReadingDoc | null;
    stamp: StampReadingDoc | null;
  };
};

export default function DailyPage(props: DailyPageProps) {
  if (props.mode === "view") {
    return <DailyPageReadOnly {...props} />;
  }

  return <DailyPageEditor {...props} />;
}
