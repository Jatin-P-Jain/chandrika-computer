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
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import React from "react";
import { CalendarFold } from "lucide-react";
import clsx from "clsx";

export function PhotocopyReadingsResponsive({
  data,
  showReadings = false,
}: {
  data: PhotocopyReadingRow[];
  showReadings: boolean;
}) {
  const tCommon = useTranslations("Common");
  const tReadings = useTranslations("Readings");

  const { textHeadingCls, textPageHeadCls, textBodyCls } =
    useLocaleTypography();

  return (
    <div className="space-y-4 w-full">
      {/* Desktop / tablet */}
      <div className="hidden md:flex rounded-md border w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className={`font-semibold ${textBodyCls}`}>
                {tCommon("Date")}
              </TableHead>
              <TableHead className={`font-semibold ${textBodyCls}`}>
                {tCommon("Particulars")}
              </TableHead>
              <TableHead className={`text-right font-semibold ${textBodyCls}`}>
                {tCommon("Total")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="">
            {data.map((r, index) => {
              const numberOfCopies = r?.difference ?? 0;

              const amount = r?.amount ?? 0;
              const stockAdded = r?.stockAdded ?? 0;
              const hasStockAdded = stockAdded > 0;

              const prevReading = r?.prevReading ?? 0;
              const todayTotalReading = r?.todayReading ?? 0;

              const dateRowSpan =
                (showReadings ? 4 : 2) + (hasStockAdded ? 1 : 0);

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
                        className={`text-muted-foreground w-0 ${textBodyCls}`}
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
                        className={`text-muted-foreground ${textBodyCls}`}
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
                  {hasStockAdded && (
                    <TableRow>
                      <TableCell className={`text-green-700 ${textBodyCls}`}>
                        {tReadings("StockAddition")}
                      </TableCell>

                      <TableCell
                        className={`text-right tabular-nums text-green-700 font-semibold ${textBodyCls}`}
                      >
                        +{stockAdded}
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
                    <TableCell
                      className={`text-muted-foreground ${textBodyCls}`}
                    >
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
                    <TableCell className={`${textBodyCls}`}>
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
            className={`rounded-md border p-2 flex flex-col gap-1 ${textBodyCls}`}
          >
            <div className="flex items-center gap-2 w-full">
              <div
                className={` font-semibold flex flex-1 min-w-0 items-center gap-1 ${textPageHeadCls}`}
              >
                <CalendarFold className="size-5 text-primary" />
                <DateDisplay
                  value={r.date}
                  type="docId"
                  className={`text-base flex-1 min-w-0 text-primary font-semibold flex items-center gap-1 ${textPageHeadCls}`}
                />
              </div>
              <div
                className={`flex shrink-0 text-sm text-right whitespace-nowrap gap-1 items-center ${textBodyCls}`}
              >
                {tCommon("Total")}:{" "}
                <span
                  className={clsx(
                    "font-semibold text-primary text-base",
                    textHeadingCls,
                  )}
                >
                  {formatINR(r.amount)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start justify-between w-full gap-1">
              {showReadings && (
                <>
                  <div
                    className={`flex justify-between w-full tabular-nums text-muted-foreground text-sm ${textBodyCls}`}
                  >
                    <span>{tReadings("YesterdayReading")}:</span>{" "}
                    {r.prevReading ?? 0}
                  </div>
                  <div
                    className={`flex justify-between w-full tabular-nums text-muted-foreground text-sm ${textBodyCls}`}
                  >
                    <span>{tReadings("TodayReading")}:</span>{" "}
                    {r.todayReading ?? 0}
                  </div>
                </>
              )}
              <div
                className={`flex justify-between w-full tabular-nums text-sm  ${textBodyCls}`}
              >
                {tReadings("PhotocopyCount")}:
                <span
                  className={clsx("font-semibold text-base", textPageHeadCls)}
                >
                  {r.difference ?? 0}
                </span>
              </div>
              <div
                className={`flex justify-between w-full text-sm  ${textBodyCls}`}
              >
                {tReadings("ActualCalculatedAmount")}:
                <span
                  className={clsx("font-semibold text-base", textPageHeadCls)}
                >
                  {formatINR(r.actualAmount)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
