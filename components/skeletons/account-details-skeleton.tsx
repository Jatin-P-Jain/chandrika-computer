"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountDetailsSkeleton() {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Skeleton className="h-10 w-10 md:h-13 md:w-13 rounded-full p-0.5 bg-muted-foreground/20" />
      <div className=" hidden md:flex flex-col items-start gap-1">
        <Skeleton className="h-4 md:h-4 w-20 md:w-30 bg-muted-foreground/20" />
        <Skeleton className="h-3 md:h-3 w-10 md:w-20 bg-muted-foreground/20" />
      </div>
    </div>
  );
}
