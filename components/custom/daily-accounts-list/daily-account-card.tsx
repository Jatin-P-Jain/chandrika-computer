"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DailyAccount } from "@/types/daily-account";
import { formatINR } from "@/lib/utils";
import {
  BookOpenCheck,
  CalendarFold,
  ChevronsRight,
  CircleCheck,
  CircleX,
  ClockPlus,
  Loader2,
} from "lucide-react";
import { DateDisplay } from "../date-display";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import clsx from "clsx";
import { useState } from "react";

type DailyAccountCardProps = {
  dailyAccount: DailyAccount;
};

export function DailyAccountCard({ dailyAccount }: DailyAccountCardProps) {
  const tDailyAccount = useTranslations("DailyAccount");
  const tCommon = useTranslations("Common");
  const { textHeadingCls, textBodyCls, textSmCls } = useLocaleTypography();
  const locale = useLocale();
  const {
    id,
    status,
    created,
    fixed,
    notes,
    earnings,
    lastNotedAt,
    lastReadingAt,
    totalEarnings,
    totalSpends,
    totalCashCollected,
  } = dailyAccount as DailyAccount;

  const hasNotesTaken =
    (notes?.length ?? 0) > 0 || Boolean(lastNotedAt && lastNotedAt.length > 0);

  const hasReadingsTaken =
    Boolean(lastReadingAt && lastReadingAt.length > 0) ||
    Number(fixed?.sd || 0) > 0 ||
    Number(fixed?.fs || 0) > 0;
  const isPersistedAccount = status === "saved" || status === "edited";
  const isDraft = status === "draft";
  // Persisted docs should open in canonical view mode; drafts open in create/complete flow.
  const cardTarget = `/daily-accounts/${id}`;

  const { push } = useSafeRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    push(cardTarget);
  };

  const createdDateTimeLabel = created
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(created))
    : "";

  return (
    <Card
      onClick={handleNavigate}
      className={clsx(
        "cursor-pointer w-full flex p-1 shadow-sm border border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.005]",
        isNavigating && "pointer-events-none opacity-85",
        isDraft && "bg-amber-50/60",
      )}
    >
      <CardContent className="flex items-start w-full p-1 flex-col">
        <div className="flex flex-col gap-2 p-1 relative w-full">
          <div className="flex items-center gap-1 justify-start w-full">
            <span
              className={`flex w-full justify-start gap-2  items-center font-semibold text-primary ${textHeadingCls}`}
            >
              <CalendarFold className="w-4 h-4 text" />
              {<DateDisplay value={id} type="docId" />}
            </span>
            {isDraft ? (
              <Badge
                variant="outline"
                className="text-[10px] border-amber-400 text-amber-700 bg-amber-50 px-1.5 py-0 h-fit w-fit"
              >
                {tDailyAccount("Draft")}
              </Badge>
            ) : status === "edited" ? (
              <Badge
                variant="outline"
                className="text-[10px] border-blue-400 text-blue-700 bg-blue-50 px-1.5 py-0 h-fit w-fit"
              >
                {tDailyAccount("Edited")}
              </Badge>
            ) : status === "saved" ? (
              <Badge
                variant="outline"
                className="text-[10px] border-green-500 text-green-700 bg-green-50 px-2 items-center justify-center"
              >
                {tDailyAccount("Saved")}
              </Badge>
            ) : null}
          </div>
          {createdDateTimeLabel ? (
            <div
              className={`flex items-center gap-1 text-[10px] text-muted-foreground ${textSmCls}`}
            >
              <ClockPlus className="size-3" />
              <span>{createdDateTimeLabel}</span>
            </div>
          ) : null}
          {/* Status badge — source of truth for account state */}

          <div className="flex flex-col w-full justify-between items-start">
            {/* Main content: financial summary for saved/edited, draft info otherwise */}
            {isPersistedAccount ? (
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
                    className={`font-medium! tabular-nums text-red-700 ${textHeadingCls}`}
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
                    className={`font-semibold tabular-nums text-primary  ${textHeadingCls}`}
                  >
                    {formatINR(Number(totalEarnings || 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between border mt-1 py-1 rounded-md px-2">
                  <span
                    className={`text-sm font-semibold text-muted-foreground ${textBodyCls}`}
                  >
                    {tDailyAccount("Income")}:
                  </span>
                  <span
                    className={`font-bold tabular-nums ${Number(earnings?.netIncome || 0) >= 0 ? " text-green-600" : "text-red-600"} ${textHeadingCls}`}
                  >
                    {formatINR(Number(earnings?.netIncome || 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs italic flex flex-col gap-2 font-medium w-full">
                {hasNotesTaken && (
                  <div className="flex items-start gap-1 text-green-800 font-normal">
                    <BookOpenCheck className="w-4 h-4" />
                    {tDailyAccount("NotesTaken")}
                  </div>
                )}
                {hasReadingsTaken && (
                  <div className="flex items-start gap-1 text-green-800 font-normal">
                    <CircleCheck className="w-4 h-4" />
                    {tDailyAccount("ReadingsTaken")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          className="flex flex-1  w-full"
          disabled={isNavigating}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate();
          }}
        >
          {isPersistedAccount
            ? tCommon("View")
            : isDraft
              ? tDailyAccount("CompleteDailyAccount")
              : tDailyAccount("CreateDailyAccount")}{" "}
          {isNavigating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ChevronsRight className="size-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
