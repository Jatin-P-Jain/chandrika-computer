"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronsRight } from "lucide-react";

export function DailyAccountCardSkeleton() {
  return (
    <Card className="cursor-pointer w-full flex p-1 lg:p-0 shadow-md border border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.005]">
      <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-0 justify-center p-1 lg:pl-4">
        <div className="flex flex-col md:col-span-5 gap-1 lg:gap-2 p-2">
          {/* Date header skeleton */}
          <div className="flex items-center gap-2 justify-start">
            <Skeleton className="h-5 w-48 rounded-sm" />
          </div>

          {/* Metrics row skeleton */}
          <div className="flex flex-col lg:flex-row w-full justify-between items-end gap-2 lg:gap-16">
            <div className="flex flex-col gap-1 w-full pl-2">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-24 rounded-sm" />
                <Skeleton className="h-6 w-24 rounded-sm" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-24 rounded-sm" />
                <Skeleton className="h-6 w-24 rounded-sm" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-24 rounded-sm" />
                <Skeleton className="h-6 w-28 rounded-sm" />
              </div>
            </div>

            {/* Tags + CreatedOrUpdated skeleton */}
            <div className="flex flex-col lg:flex-row w-full justify-between items-start lg:items-end gap-1 lg:gap-0">
              <div className="flex flex-wrap gap-1 lg:justify-end w-full items-center lg:items-end">
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Button skeleton */}
        <div className="col-span-1">
          <Skeleton className="w-full md:h-full lg:rounded-l-none h-8" />
        </div>
      </CardContent>
    </Card>
  );
}
