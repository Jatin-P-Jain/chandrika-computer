"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PhotocopyReadingRow } from "@/types/readings";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { Newspaper } from "lucide-react";
import dynamic from "next/dynamic";

const PhotocopyReadingsResponsive = dynamic(
  () =>
    import("./photocopy-readings-responsive").then(
      (m) => m.PhotocopyReadingsResponsive,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full space-y-2">
        <div className="h-12 w-full animate-pulse rounded-md border bg-muted/40" />
        <div className="h-20 w-full animate-pulse rounded-md border bg-muted/40" />
      </div>
    ),
  },
);

export function PhotocopyRegisterClient({
  photocopyReadingPromise,
}: {
  photocopyReadingPromise: Promise<{
    data: PhotocopyReadingRow[];
    nextPageToken: string | undefined;
  }>;
}) {
  const { data } = React.use(photocopyReadingPromise);
  const tCommon = useTranslations("Common");
  const tPhotocopyRegister = useTranslations("PhotocopyRegister");
  const [showReadings, setShowReadings] = React.useState(false);

  const { textPageHeadCls, textSmCls } = useLocaleTypography();

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-3 w-full">
        <h1
          className={`text-lg font-semibold flex items-center gap-2 ${textPageHeadCls}`}
        >
          <Newspaper className="size-6" />
          {tPhotocopyRegister("PhotocopyRegister")}
        </h1>

        <div className="flex items-center gap-2">
          <Switch
            id="show-readings"
            checked={showReadings}
            onCheckedChange={setShowReadings}
          />
          <Label htmlFor="show-readings" className={textSmCls}>
            {tCommon("ShowReadings")}
          </Label>
        </div>
      </div>

      <div className="flex w-full">
        <PhotocopyReadingsResponsive data={data} showReadings={showReadings} />
      </div>
    </div>
  );
}
