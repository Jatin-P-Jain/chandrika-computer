"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PhotocopyReadingRow } from "@/types/readings";
import { useLocale, useTranslations } from "next-intl";
import { PhotocopyReadingsResponsive } from "./photocopy-readings-responsive";

export function PhotocopyRegisterClient({
  data,
}: {
  data: PhotocopyReadingRow[];
}) {
  const tCommon = useTranslations("Common");
  const tPhotocopyRegister = useTranslations("PhotocopyRegister");
  const [showReadings, setShowReadings] = React.useState(false);

  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadingCls = isHi ? "text-lg! md:text-xl!" : "";
  const textSmCls = isHi ? "text-sm md:text-base!" : "";

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-3 w-full">
        <h1 className={`text-lg font-semibold ${textHeadingCls}`}>
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
