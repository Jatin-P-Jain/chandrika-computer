"use client";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { ClipboardListIcon, LayoutList, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useState } from "react";

const DailyAccountHeader = () => {
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const { textSubheadingCls } = useLocaleTypography();
  const { push } = useSafeRouter();
  const [isNavigatingList, setIsNavigatingList] = useState(false);

  const handleViewAll = () => {
    if (isNavigatingList) return;
    setIsNavigatingList(true);
    push("/daily-accounts");
  };
  return (
    <div className="flex justify-between items-center w-full">
      <h1 className="flex justify-between items-center gap-1 font-semibold text-primary md:text-lg">
        <ClipboardListIcon className="size-5" />
        {tDailyAccount("Title")}
      </h1>
      <Button
        variant="ghost"
        onClick={handleViewAll}
        disabled={isNavigatingList}
        className={clsx(
          "flex gap-2 justify-between items-center font-semibold text-sm md:text-base text-primary p-0! hover:bg-transparent hover:text-primary",
          textSubheadingCls,
        )}
      >
        {isNavigatingList ? (
          <>
            {tCommon("ViewAll")}
            <Loader2 className="size-4 md:size-5 animate-spin" />
          </>
        ) : (
          <>
            {tCommon("ViewAll")}
            <LayoutList className="size-4 md:size-5" />
          </>
        )}
      </Button>
    </div>
  );
};

export default DailyAccountHeader;
