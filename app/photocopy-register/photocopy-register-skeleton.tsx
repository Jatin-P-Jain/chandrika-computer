import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Newspaper } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

function DesktopRows({ rows = 4 }: { rows?: number }) {
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textBodyCls = isHi ? "text-base!" : "text-sm";

  return (
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

        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <React.Fragment key={i}>
              {/* mimic your 2 base rows: Count + Amount */}
              <TableRow>
                <TableCell className="w-[20%]">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="w-[20%]">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="w-[20%]">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-[20%]">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="w-[20%]">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="w-[20%]">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>

              {/* mimic your divider spacer row (colSpan=3, p-1) */}
              {i < rows - 1 && (
                <TableRow>
                  <TableCell colSpan={3} className="p-1" />
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileCards({ items = 4 }: { items?: number }) {
  return (
    <div className="md:hidden space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-md border p-3 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex justify-between w-full">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PhotocopyRegisterSkeleton() {
  const tPhotocopy = useTranslations("PhotocopyRegister");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadingCls = isHi ? "text-lg! md:text-xl!" : "";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Keep header area stable: real title text + switch skeleton */}
      <div className="flex items-center justify-between gap-3 w-full">
        <h1 className={`text-lg font-semibold flex items-center gap-2 ${textHeadingCls}`}>
          <Newspaper className="size-6" />
          {tPhotocopy("PhotocopyRegister")}
        </h1>

        {/* switch-sized skeleton, same as your stamp skeleton */}
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
