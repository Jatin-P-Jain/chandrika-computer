"use client";
import { LayoutList, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toDocId } from "@/lib/utils";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useState } from "react";

const FiltersSection = dynamic(
  () =>
    import("../filter-section/filters-section").then((m) => m.FiltersSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-56 animate-pulse rounded-md border bg-muted/40" />
    ),
  },
);

export default function DailyAccountListHeader() {
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const { textHeadingCls } = useLocaleTypography();
  const { push } = useSafeRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCreateAccount = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    push(`/daily-accounts/${toDocId()}`);
  };
  return (
    <div className="flex justify-between lg:justify-end items-center w-full gap-3">
      <h1
        className={`flex justify-center items-center gap-1 font-semibold text-primary min-w-fit! text-xl ${textHeadingCls}`}
      >
        <LayoutList className="size-5" />
        {tDailyAccount("AllDailyAccounts")}
      </h1>
      <Button
        onClick={handleCreateAccount}
        disabled={isNavigating}
        size="sm"
        variant="outline"
        className={`border shadow-lg border-primary text-primary font-bold text-base tracking-normal hover:bg-primary hover:text-white`}
      >
        {isNavigating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PlusCircle className="size-5" />
        )}
        {tCommon("Create")}
      </Button>
      <div className="lg:flex hidden ml-auto flex-1 items-center gap-4">
        <FiltersSection />
      </div>
    </div>
  );
}
