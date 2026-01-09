"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyAccount } from "@/types/daily-account";
import { formatINR } from "@/lib/utils";
import { ChevronsRight } from "lucide-react";
import { DateDisplay } from "../date-display";
import CreatedOrUpdated from "../created-or-updated";

type DailyAccountCardProps = {
  dailyAccount: DailyAccount;
};

export function DailyAccountCard({ dailyAccount }: DailyAccountCardProps) {
  const {
    id,
    totalCashCollected,
    created,
    updated,
    earnings,
    createdBy,
    updatedBy,
    businessExpenses,
    dailySpends,
  } = dailyAccount as DailyAccount;

  const totalEarnings =
    Number(earnings?.netIncome || 0) +
    (Array.isArray(earnings?.otherIncomes)
      ? earnings.otherIncomes.reduce(
          (sum: number, x: any) => sum + Number(x?.amount || 0),
          0
        )
      : 0);

  const tags = [
    ...earnings.otherIncomes.map((x) => x.tags || []),
    ...businessExpenses.map((x) => x.tags || []),
    ...dailySpends.map((x) => x.tags || []),
  ].flat();

  return (
    <Card className="cursor-pointer w-full flex p-1 lg:p-0 shadow-md border border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.005]">
      <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-0 justify-center p-1">
        <div className="flex flex-col md:col-span-5 gap-1 lg:gap-2 p-2">
          <div className="flex items-center gap-2 justify-start">
            <span className="hidden lg:flex text-xs text-muted-foreground">
              Daily Account:
            </span>{" "}
            <span className="font-semibold text-primary text-lg">
              {<DateDisplay value={id} type="docId" />}
            </span>
          </div>
          <div className="flex flex-col lg:flex-row w-full justify-between items-end gap-2 lg:gap-16">
            <div className="flex flex-col gap-1 w-full pl-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Total Cash Collected:
                </span>
                <span className="text-base font-bold tabular-nums text-primary">
                  {formatINR(Number(totalCashCollected || 0))}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Total Earnings:
                </span>
                <span className="text-base font-bold tabular-nums text-green-600">
                  {formatINR(Number(totalEarnings || 0))}
                </span>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-2 w-full justify-between">
              <div className="flex h-full justify-center gap-4 bg-primary/10 rounded-md p-1 px-2">
                <div className="h-full flex flex-col justify-end items-start gap-1 w-full">
                  {tags.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      All Tags:
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No Tags
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1 max-w-xs justify-end items-center">
                    {tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-primary/20 text-primary font-semibold text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className=" text-muted-foreground font-semibold text-xs">
                        +{tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <CreatedOrUpdated created={created} updated={updated} />
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <Button
            asChild
            className="w-full md:h-full lg:rounded-l-none! text-base sm:flex-row md:flex-col lg:flex-row"
          >
            <Link href={`/daily-accounts/${id}`}>
              View Details <ChevronsRight className="size-6 lg:size-8" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
