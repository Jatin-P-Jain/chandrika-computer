"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyAccount } from "@/types/daily-account";
import { formatINR } from "@/lib/utils";
import {
  BookOpenCheck,
  ChevronsRight,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { DateDisplay } from "../date-display";
import CreatedOrUpdated from "../created-or-updated";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import clsx from "clsx";

type DailyAccountCardProps = {
  dailyAccount: DailyAccount;
};

export function DailyAccountCard({ dailyAccount }: DailyAccountCardProps) {
  const tDailyAccount = useTranslations("DailyAccount");
  const { textHeadingCls, textBodyCls, textSmCls } = useLocaleTypography();
  const {
    id,
    fixed,
    notes,
    lastNotedAt,
    lastReadingAt,
    totalEarnings,
    totalSpends,
    totalCashCollected,
    allTags,
    created,
    updated,
    createdBy,
    updatedBy,
  } = dailyAccount as DailyAccount;

  const hasFinancialSummary =
    Number(totalCashCollected || 0) > 0 ||
    Number(totalSpends || 0) > 0 ||
    Number(totalEarnings || 0) > 0;

  const hasNotesTaken =
    (notes?.length ?? 0) > 0 || Boolean(lastNotedAt && lastNotedAt.length > 0);

  const hasReadingsTaken =
    Boolean(lastReadingAt && lastReadingAt.length > 0) ||
    Number(fixed?.sd || 0) > 0 ||
    Number(fixed?.fs || 0) > 0;

  const { push } = useSafeRouter();

  return (
    <Card
      onClick={() => {
        push(`/daily-accounts/${id}?mode=view`);
      }}
      className={clsx(
        "cursor-pointer w-full flex p-1 lg:p-0 shadow-md border border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.005]",
        !hasFinancialSummary && "bg-amber-50/60",
      )}
    >
      <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-0 justify-center p-1 lg:pl-4">
        <div className="flex flex-col md:col-span-5 gap-2 p-2 relative">
          <div className="flex items-center gap-2 justify-start">
            <span
              className={`hidden lg:flex text-xs text-muted-foreground ${textSmCls}`}
            >
              {tDailyAccount("DailyAccount")}:
            </span>{" "}
            <span
              className={`flex w-full justify-between  items-center font-semibold text-primary text-sm ${textBodyCls}`}
            >
              {<DateDisplay value={id} type="docId" />}
            </span>
          </div>
          <div className="flex flex-col lg:flex-row w-full justify-between items-start gap-2 lg:gap-16">
            {hasFinancialSummary ? (
              <div className="flex flex-col gap-0 w-full pl-2">
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`text-sm text-muted-foreground ${textBodyCls}`}
                  >
                    {tDailyAccount("TotalCashCollected")}:
                  </span>
                  <span
                    className={`font-medium! tabular-nums text-primary ${textHeadingCls}`}
                  >
                    {formatINR(Number(totalCashCollected || 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`text-sm text-muted-foreground ${textBodyCls}`}
                  >
                    {tDailyAccount("TotalExpenses")}:
                  </span>
                  <span
                    className={`font-medium! tabular-nums text-red-600 ${textHeadingCls}`}
                  >
                    {formatINR(Number(totalSpends || 0))}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`text-sm text-muted-foreground ${textBodyCls}`}
                  >
                    {tDailyAccount("TotalIncome")}:
                  </span>
                  <span
                    className={`font-bold tabular-nums text-green-600 ${textHeadingCls}`}
                  >
                    {formatINR(Number(totalEarnings || 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs italic flex flex-col gap-2 font-medium">
                {hasNotesTaken && (
                  <div className="flex items-center gap-1 text-green-800 font-normal">
                    <BookOpenCheck className="w-4 h-4" />
                    {tDailyAccount("NotesTaken")}
                  </div>
                )}
                {hasReadingsTaken && (
                  <div className="flex items-center gap-1 text-green-800 font-normal">
                    <CircleCheck className="w-4 h-4" />
                    {tDailyAccount("ReadingsTaken")}
                  </div>
                )}
                <div className="flex items-center gap-1 text-red-600">
                  <CircleX className="w-4 h-4" />
                  {tDailyAccount("DailyAccountNotSaved")}
                </div>
              </div>
            )}
            <div className="flex flex-col lg:flex-row w-full justify-between items-start lg:items-end gap-1 lg:gap-0">
              <div className="flex flex-col lg:flex-row w-full justify-end gap-1">
                <div className="flex flex-wrap gap-1 lg:justify-end w-full items-center lg:items-end">
                  {allTags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className={`bg-primary/20 text-primary font-semibold text-xs px-2 py-1 rounded-full`}
                    >
                      {tag}
                    </span>
                  ))}
                  {allTags.length > 3 && (
                    <span
                      className={`text-muted-foreground font-semibold text-xs ${textSmCls}`}
                    >
                      +{allTags.length - 3} more
                    </span>
                  )}
                </div>
                <CreatedOrUpdated
                  createdBy={createdBy}
                  updatedBy={updatedBy}
                  created={created}
                  updated={updated}
                />
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full md:h-full lg:rounded-l-none! text-sm sm:flex-row md:flex-col lg:flex-row">
          {tDailyAccount("ViewAccount")} <ChevronsRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
