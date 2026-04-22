"use client";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { ClipboardListIcon, LayoutList } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { SafeLink } from "@/components/custom/SafeLink";

const DailyAccountHeader = () => {
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const { textSubheadingCls } = useLocaleTypography();
  return (
    <div className="flex justify-between items-center w-full">
      <h1 className="flex justify-center items-center gap-1 font-semibold text-primary text-lg md:text-xl">
        <ClipboardListIcon className="size-5" />
        {tDailyAccount("Title")}
      </h1>
      <Button
        variant="ghost"
        className={clsx(
          "flex gap-2 justify-between items-center font-semibold text-sm md:text-base text-primary p-0! hover:bg-transparent hover:text-primary",
          textSubheadingCls,
        )}
        asChild
      >
        <SafeLink href="/daily-accounts">
          {tCommon("ViewAll")}
          <LayoutList className="size-4 md:size-5" />
        </SafeLink>
      </Button>
    </div>
  );
};

export default DailyAccountHeader;
