"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyAccount } from "@/types/daily-account";
import { formatINR } from "@/lib/utils";
import { ChevronsRight } from "lucide-react";

type DailyAccountCardProps = {
  dailyAccount: DailyAccount;
};

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate(); // Firestore Timestamp fallback
  return null;
}

function formatDateTime(value: any) {
  const d = toDate(value);
  if (!d) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  // Using toLocaleString() with Intl options is a standard date formatting approach. [web:210][web:213]
}

export function DailyAccountCard({ dailyAccount }: DailyAccountCardProps) {
  const {
    id,
    totalCashCollected,
    created,
    updated,
    earnings,
    createdBy,
    updatedBy,
  } = dailyAccount as DailyAccount;

  console.log({ createdBy, updatedBy });

  const totalEarnings =
    Number(earnings?.netIncome || 0) +
    (Array.isArray(earnings?.otherIncomes)
      ? earnings.otherIncomes.reduce(
          (sum: number, x: any) => sum + Number(x?.amount || 0),
          0
        )
      : 0);

  return (
    <Card className="w-full flex">
      <CardHeader>
        <CardTitle>{toDate(id)?.toDateString()}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Cash</span>
          <span className="text-base font-semibold">
            {formatINR(Number(totalCashCollected || 0))}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Earnings</span>
          <span className="text-base font-semibold">
            {formatINR(Number(totalEarnings || 0))}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created</span>
          <span className="text-sm">{formatDateTime(created)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Updated</span>
          <span className="text-sm">
            {updated ? formatDateTime(updated) : "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created By</span>
          <span className="text-sm">
            {createdBy ? createdBy.displayName : "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Updated By</span>
          <span className="text-sm">
            {updatedBy ? updatedBy.displayName : "-"}
          </span>
        </div>

        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href={`/daily-accounts/${id}`}>
              View Details <ChevronsRight className="size-5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
