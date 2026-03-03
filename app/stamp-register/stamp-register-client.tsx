"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StampReadingsResponsive } from "./stamp-readings-responsive";
import type { StampReadingRow } from "@/types/readings";
import { useLocale, useTranslations } from "next-intl";
import { Layers } from "lucide-react";

export function StampRegisterClient({
  stampReadingPromise,
}: {
  stampReadingPromise: Promise<{
    data: StampReadingRow[];
    totalPages: number | undefined;
    totalItems: number | undefined;
  }>;
}) {
  const { data } = React.use(stampReadingPromise);
  const tCommon = useTranslations("Common");
  const tStampRegister = useTranslations("StampRegister");
  const [showReadings, setShowReadings] = React.useState(false);

  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadingCls = isHi ? "text-lg! md:text-xl!" : "";
  const textSmCls = isHi ? "text-sm md:text-base!" : "";

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
          <Label htmlFor="show-readings" className={textSmCls}>
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
