import { LanguageFontWrapper } from "@/components/custom/wrappers/language-font-wrapper";
import { LocaleToggle } from "@/components/custom/action-items/locale-toggle";
import { ThemeModeToggle } from "@/components/custom/action-items/theme-mode-button";
import { Card } from "@/components/ui/card";
import clsx from "clsx";
import { useTranslations } from "next-intl";

export default function Home() {
  const tHomePage = useTranslations("HomePage");
  return (
    <div className={clsx("flex items-center justify-center")}>
      <main className="flex w-full max-w-7xl flex-col items-center justify-between py-32 px-16">
        <Card>
          <div className="flex flex-col items-center p-8">
            <h1 className="mb-4 text-4xl font-semibold">
              {tHomePage("WelcomeMessage")}
            </h1>
            <p className="text-center ">{tHomePage("Description")}</p>
          </div>
          <ThemeModeToggle />
          <LocaleToggle />
        </Card>
      </main>
    </div>
  );
}
