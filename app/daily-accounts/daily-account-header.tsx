"use client";
import clsx from "clsx";
import { ClipboardListIcon, LayoutList } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const DailyAccountHeader = () => {
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "text-lg! font-[inherit]");
  return (
    <div className="flex justify-between items-center w-full">
      <h1 className="flex justify-center items-center gap-1 font-semibold text-primary text-lg md:text-xl">
        <ClipboardListIcon className="size-5" />
        {tDailyAccount("Title")}
      </h1>
      <div
        className={clsx(
          "flex gap-2 justify-between items-center font-semibold text-sm md:text-base text-primary",
          textCls
        )}
      >
        {tCommon("ViewAll")}
        <LayoutList className="size-4 md:size-5" />
      </div>
    </div>
  );
};

export default DailyAccountHeader;
