import { DateDisplay } from "@/components/custom/date-display";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import type { StampReadingRow, Denomination } from "@/types/readings";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

const DENOMS: Denomination[] = [50, 100, 500, 1000];

export function StampReadingsResponsive({
  data,
  showReadings = false,
}: {
  data: StampReadingRow[];
  showReadings: boolean;
}) {
  const tCommon = useTranslations("Common");
  const tReadings = useTranslations("Readings");

  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadingCls = isHi ? "text-lg! md:text-xl!" : "";
  const textBodyCls = isHi ? "text-base!" : "";
  const textSmCls = isHi ? "text-sm md:text-base!" : "";

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
              {DENOMS.map((d) => (
                <TableHead
                  key={d}
                  className={`text-right font-semibold ${textBodyCls}`}
                >
                  ₹{d}
                </TableHead>
              ))}
              <TableHead className={`text-right font-semibold ${textBodyCls}`}>
                {tCommon("Total")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="">
            {data.map((r, index) => {
              const diffs = DENOMS.map((d) => r.parts[d]?.difference ?? 0);
              const totalStampCount = diffs.reduce((a, b) => a + b, 0);

              const amounts = DENOMS.map((d) => r.parts[d]?.amount ?? 0);
              const total = r.totalAmount ?? amounts.reduce((a, b) => a + b, 0);

              const prevTotalReading = DENOMS.reduce(
                (acc, d) => acc + (r.parts[d]?.prevReading ?? 0),
                0,
              );
              const todayTotalReading = DENOMS.reduce(
                (acc, d) => acc + (r.parts[d]?.todayReading ?? 0),
                0,
              );

              const dateRowSpan = showReadings ? 4 : 2;
              const dividerColSpan = DENOMS.length + 3; // Date + Particulars + denoms + Total

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
                      {DENOMS.map((d) => (
                        <TableCell
                          key={d}
                          className={`text-right tabular-nums text-muted-foreground ${textBodyCls}`}
                        >
                          {r.parts[d]?.prevReading ?? 0}
                        </TableCell>
                      ))}
                      <TableCell
                        className={`text-right tabular-nums text-muted-foreground ${textBodyCls}`}
                      >
                        {prevTotalReading}
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
                      {DENOMS.map((d) => (
                        <TableCell
                          key={d}
                          className={`text-right tabular-nums text-muted-foreground ${textBodyCls}`}
                        >
                          {r.parts[d]?.todayReading ?? 0}
                        </TableCell>
                      ))}
                      <TableCell
                        className={`text-right tabular-nums text-muted-foreground ${textBodyCls}`}
                      >
                        {todayTotalReading}
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Row 3: Stamp Count */}
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
                      {tReadings("StampCount")}
                    </TableCell>
                    {DENOMS.map((d) => (
                      <TableCell
                        key={d}
                        className={`text-right tabular-nums text-muted-foreground ${textBodyCls}`}
                      >
                        {r.parts[d]?.difference ?? 0}
                      </TableCell>
                    ))}
                    <TableCell
                      className={`text-right font-semibold tabular-nums text-muted-foreground ${textBodyCls}`}
                    >
                      {totalStampCount}
                    </TableCell>
                  </TableRow>

                  {/* Row 4: Stamp Value */}
                  <TableRow>
                    <TableCell className={`${textBodyCls}`}>
                      {tReadings("StampAmount")}
                    </TableCell>
                    {DENOMS.map((d) => (
                      <TableCell
                        key={d}
                        className={`text-right tabular-nums font-semibold ${textBodyCls}`}
                      >
                        {formatINR(r.parts[d]?.amount ?? 0.0, true, false)}
                      </TableCell>
                    ))}
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${textBodyCls}`}
                    >
                      {formatINR(total, true, false)}
                    </TableCell>
                  </TableRow>

                  {/* Divider */}
                  {index < data.length - 1 && (
                    <TableRow className="">
                      <TableCell colSpan={dividerColSpan} className="p-1">
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
          <div key={r.date} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.date}</div>
              <div className="font-semibold">
                Total: {formatINR(r.totalAmount)}
              </div>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-4 gap-2 text-sm">
              {DENOMS.map((d) => (
                <div key={d} className="rounded-md bg-muted p-2">
                  <div className="text-xs text-muted-foreground">{d}</div>
                  <div className="mt-1">
                    Diff: {r.parts[d]?.difference ?? 0}
                  </div>
                  <div className="text-muted-foreground">
                    Val: {formatINR(r.parts[d]?.amount ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
