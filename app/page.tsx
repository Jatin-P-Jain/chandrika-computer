import { LanguageFontWrapper } from "@/components/custom/wrappers/language-font-wrapper";
import { LocaleToggle } from "@/components/custom/action-items/locale-toggle";
import { ThemeModeToggle } from "@/components/custom/action-items/theme-mode-button";
import { Card } from "@/components/ui/card";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { ServicesGate } from "@/components/custom/sections/services-gate";

export default function Home() {
  const tHomePage = useTranslations("HomePage");
  return (
    <div className={clsx("flex items-center justify-center")}>
      <main className="flex w-full max-w-7xl flex-col items-center justify-between py-32 px-16">
        <ServicesGate />
      </main>
    </div>
  );
}
