import { DateDisplay } from "@/components/custom/date-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import type { PhotocopyReadingRow } from "@/types/readings";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

export function PhotocopyReadingsResponsive({
  data,
  showReadings = false,
}: {
  data: PhotocopyReadingRow[];
  showReadings: boolean;
}) {
  const tCommon = useTranslations("Common");
  const tReadings = useTranslations("Readings");

  const locale = useLocale();
  const isHi = locale === "hi";
  const textBodyCls = isHi ? "text-base md:text-lg!" : "text-sm";
  const textSmCls = isHi ? "text-sm md:text-base!" : "text-xs";

  return (
    <div className="space-y-4 w-full">
      {/* Desktop / tablet */}
      <div className="hidden md:flex rounded-md border w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className={`font-semibold ${textSmCls}`}>
                {tCommon("Date")}
              </TableHead>
              <TableHead className={`font-semibold ${textSmCls}`}>
                {tCommon("Particulars")}
              </TableHead>
              <TableHead className={`text-right font-semibold ${textSmCls}`}>
                {tCommon("Total")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="">
            {data.map((r, index) => {
              const numberOfCopies = r?.difference ?? 0;

              const amount = r?.amount ?? 0;

              const prevReading = r?.prevReading ?? 0;
              const todayTotalReading = r?.todayReading ?? 0;

              const dateRowSpan = showReadings ? 4 : 2;

              return (
                <React.Fragment key={r.date}>
                  {/* Row 1: Previous Day readings (optional) */}
                  {showReadings && (
                    <TableRow>
                      <TableCell
                        className="border-r align-middle w-[15%]"
                        rowSpan={dateRowSpan}
                      >
                        <DateDisplay
                          value={r.date}
                          type="docId"
                          className={`text-primary font-semibold flex flex-col justify-center items-center ${textBodyCls}`}
                        />
                      </TableCell>
                      <TableCell
                        className={`text-muted-foreground w-0 ${textSmCls}`}
                      >
                        {tReadings("YesterdayReading")}
                      </TableCell>

                      <TableCell
                        className={`text-right tabular-nums text-muted-foreground ${textBodyCls}`}
                      >
                        {prevReading}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Row 2: Today readings (optional) */}
                  {showReadings && (
                    <TableRow>
                      <TableCell
                        className={`text-muted-foreground ${textSmCls}`}
                      >
                        {tReadings("TodayReading")}
                      </TableCell>

                      <TableCell
                        className={`text-right tabular-nums text-muted-foreground ${textBodyCls}`}
                      >
                        {todayTotalReading}
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Row 3: Photocopy Count */}
                  <TableRow>
                    {!showReadings && (
                      <TableCell
                        className={`border-r align-middle w-[15%] ${textBodyCls}`}
                        rowSpan={dateRowSpan}
                      >
                        <DateDisplay
                          value={r.date}
                          type="docId"
                          className={`text-primary font-semibold flex flex-col justify-center items-center ${textBodyCls}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className={`text-muted-foreground ${textSmCls}`}>
                      {tReadings("PhotocopyCount")}
                    </TableCell>

                    <TableCell
                      className={`text-right font-semibold tabular-nums text-muted-foreground ${textBodyCls}`}
                    >
                      {numberOfCopies}
                    </TableCell>
                  </TableRow>

                  {/* Row 4: Photocopy Value */}
                  <TableRow>
                    <TableCell className={`${textSmCls}`}>
                      {tReadings("PhotocopyAmount")}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${textBodyCls}`}
                    >
                      {formatINR(amount, true, false)}
                    </TableCell>
                  </TableRow>

                  {/* Divider */}
                  {index < data.length - 1 && (
                    <TableRow className="">
                      <TableCell colSpan={3} className="p-1">
                        {/* <Separator className="" /> */}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {data.map((r) => (
          <div
            key={r.date}
            className="rounded-md border p-3 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between">
              <DateDisplay
                value={r.date}
                type="docId"
                className={`w-full text-primary font-semibold flex items-center gap-1 ${textBodyCls}`}
              />
              <div
                className={`font-semibold w-full text-right gap-2 items-center flex justify-end ${textBodyCls}`}
              >
                <span className="text-muted-foreground font-normal text-sm">
                  {tCommon("Total")}:
                </span>{" "}
                {formatINR(r.amount ?? 0)}
              </div>
            </div>
            <div className="flex flex-col items-start justify-between w-full gap-1">
              {showReadings && (
                <>
                  <div
                    className={`flex justify-between w-full tabular-nums text-muted-foreground ${textSmCls}`}
                  >
                    <span>{tReadings("YesterdayReading")}:</span>{" "}
                    {r.prevReading ?? 0}
                  </div>
                  <div
                    className={`flex justify-between w-full tabular-nums text-muted-foreground ${textSmCls}`}
                  >
                    <span>{tReadings("TodayReading")}:</span>{" "}
                    {r.todayReading ?? 0}
                  </div>
                </>
              )}
              <div
                className={`flex justify-between w-full tabular-nums font-semibold  ${textSmCls}`}
              >
                <span className="font-normal">
                  {tReadings("PhotocopyCount")}:
                </span>{" "}
                {r.difference ?? 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
