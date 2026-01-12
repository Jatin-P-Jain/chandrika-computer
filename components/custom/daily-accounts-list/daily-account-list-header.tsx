"use client";
import { LayoutList, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toDocId } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { FiltersSection } from "../filter-section/filters-section";

export default function DailyAccountListHeader() {
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadCls = isHi ? "text-xl!" : "";
  return (
    <div className="flex justify-between lg:justify-end items-center w-full gap-4">
      <h1
        className={`flex justify-center items-center gap-1 font-semibold text-primary min-w-fit! ${textHeadCls}`}
      >
        <LayoutList className="size-4 md:size-5" />
        {tDailyAccount("AllDailyAccounts")}
      </h1>
      <Button
        asChild
        size="sm"
        variant="outline"
        className={`border shadow-lg border-primary text-primary font-bold -tracking-normal hover:bg-primary hover:text-white`}
      >
        <Link href={`/daily-accounts/${toDocId()}`}>
          {tCommon("Create")} <PlusCircle className="size-5" />
        </Link>
      </Button>
      <div className="lg:flex hidden ml-auto">
        <FiltersSection />
      </div>
    </div>
  );
}
