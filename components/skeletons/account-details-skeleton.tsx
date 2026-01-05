"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountDetailsSkeleton() {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Skeleton className="h-8 w-8 md:h-13 md:w-13 rounded-full p-0.5 bg-muted-foreground/20" />
      <div className="flex flex-col items-start gap-1">
        <Skeleton className="h-4 md:h-5 w-40 md:w-50 bg-muted-foreground/20" />
        <Skeleton className="h-3 md:h-4 w-30 md:w-40 bg-muted-foreground/20" />
        <Skeleton className="h-3 md:h-4 w-30 md:w-36 bg-muted-foreground/20" />
      </div>
    </div>
  );
}
