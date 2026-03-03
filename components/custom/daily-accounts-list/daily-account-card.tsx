"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyAccount } from "@/types/daily-account";
import { formatINR } from "@/lib/utils";
import { ChevronsRight } from "lucide-react";
import { DateDisplay } from "../date-display";
import CreatedOrUpdated from "../created-or-updated";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "nextjs-toploader/app";

type DailyAccountCardProps = {
  dailyAccount: DailyAccount;
};

export function DailyAccountCard({ dailyAccount }: DailyAccountCardProps) {
  const tDailyAccount = useTranslations("DailyAccount");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadCls = isHi ? "font-semibold text-xl!" : "";
  const textBodyCls = isHi ? "font-medium text-lg!" : "";
  const textSmCls = isHi ? "text-sm! lg:text-base!" : "";
  const {
    id,
    totalEarnings,
    totalSpends,
    totalCashCollected,
    allTags,
    created,
    updated,
    createdBy,
    updatedBy,
  } = dailyAccount as DailyAccount;

  const router = useRouter();

  return (
    <Card
      onClick={() => {
        router.push(`/daily-accounts/${id}`);
      }}
      className="cursor-pointer w-full flex p-1 lg:p-0 shadow-md border border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.005]"
    >
      <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-0 justify-center p-1 lg:pl-4">
        <div className="flex flex-col md:col-span-5 gap-1 lg:gap-2 p-2">
          <div className="flex items-center gap-2 justify-start">
            <span
              className={`hidden lg:flex text-xs text-muted-foreground ${textSmCls}`}
            >
              {tDailyAccount("DailyAccount")}:
            </span>{" "}
            <span className={`font-semibold text-primary ${textHeadCls}`}>
              {<DateDisplay value={id} type="docId" />}
            </span>
          </div>
          <div className="flex flex-col lg:flex-row w-full justify-between items-end gap-2 lg:gap-16">
            <div className="flex flex-col gap-0 w-full pl-2">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`text-sm text-muted-foreground ${textBodyCls}`}
                >
                  {tDailyAccount("TotalCashCollected")}:
                </span>
                <span
                  className={`font-medium! tabular-nums text-primary ${textHeadCls}`}
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
                  className={`font-medium! tabular-nums text-red-600 ${textHeadCls}`}
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
                  className={`font-bold tabular-nums text-green-600 ${textHeadCls}`}
                >
                  {formatINR(Number(totalEarnings || 0))}
                </span>
              </div>
            </div>
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

        <div className="col-span-1">
          <Button className="w-full md:h-full lg:rounded-l-none! text-base sm:flex-row md:flex-col lg:flex-row">
            View Details <ChevronsRight className="size-6 lg:size-8" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
