"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { StampReadingRow } from "@/types/readings";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { Layers } from "lucide-react";
import dynamic from "next/dynamic";

const StampReadingsResponsive = dynamic(
  () =>
    import("./stamp-readings-responsive").then(
      (m) => m.StampReadingsResponsive,
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

export function StampRegisterClient({
  stampReadingPromise,
}: {
  stampReadingPromise: Promise<{
    data: StampReadingRow[];
    nextPageToken: string | undefined;
  }>;
}) {
  const { data } = React.use(stampReadingPromise);
  const tCommon = useTranslations("Common");
  const tStampRegister = useTranslations("StampRegister");
  const [showReadings, setShowReadings] = React.useState(false);

  const { textHeadingCls, textBodyCls } = useLocaleTypography();

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-3 w-full">
        <h1
          className={`text-lg font-semibold flex items-center gap-2 ${textHeadingCls}`}
        >
          <Layers className="size-6" />
          {tStampRegister("StampRegister")}
        </h1>

        <div className="flex items-center gap-2">
          <Switch
            id="show-readings"
            checked={showReadings}
            onCheckedChange={setShowReadings}
          />
          <Label htmlFor="show-readings" className={textBodyCls}>
            {tCommon("ShowReadings")}
          </Label>
        </div>
      </div>

      <div className="flex w-full">
        <StampReadingsResponsive data={data} showReadings={showReadings} />
      </div>
    </div>
  );
}
