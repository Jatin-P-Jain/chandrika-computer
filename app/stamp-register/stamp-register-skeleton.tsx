"use client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";

const DENOMS = [50, 100, 500, 1000] as const;

function DesktopRows({ rows = 6 }: { rows?: number }) {
  const colCount = DENOMS.length + 3; // Date + Particulars + denoms + Total
  const tCommon = useTranslations("Common");

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="hidden md:flex rounded-md border w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="font-semibold">{tCommon("Date")}</TableHead>
              <TableHead className="font-semibold">
                {tCommon("Particulars")}
              </TableHead>
              {DENOMS.map((d) => (
                <TableHead key={d} className="text-right font-semibold">
                  ₹{d}
                </TableHead>
              ))}
              <TableHead className="text-right font-semibold">
                {tCommon("Total")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: colCount }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MobileCards({ items = 4 }: { items?: number }) {
  return (
    <div className="md:hidden space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="my-3">
            <Skeleton className="h-px w-full" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {DENOMS.map((d) => (
              <div key={d} className="rounded-md bg-muted p-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StampRegisterSkeleton() {
  const tStampRegister = useTranslations("StampRegister");
  const { textPageHeadCls } = useLocaleTypography();
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Keep header area shape so layout doesn't jump */}
      <div className="flex items-center justify-between gap-3 w-full">
        <h1
          className={`text-lg font-semibold flex items-center gap-2 ${textPageHeadCls}`}
        >
          <Layers className="size-6" />
          {tStampRegister("StampRegister")}
        </h1>

        <Skeleton className="h-6 w-10 rounded-full" />
      </div>

      <div className="flex w-full">
        <div className="w-full">
          <DesktopRows />
          <MobileCards />
        </div>
      </div>
    </div>
  );
}
