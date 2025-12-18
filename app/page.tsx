import { LanguageFontWrapper } from "@/components/custom/language-font-wrapper";
import { LocaleToggle } from "@/components/custom/locale-toggle";
import { ThemeModeToggle } from "@/components/custom/theme-mode-button";
import { Card } from "@/components/ui/card";
import clsx from "clsx";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <div className={clsx("flex min-h-screen items-center justify-center")}>
      <main className="flex min-h-screen w-full max-w-7xl flex-col items-center justify-between py-32 px-16">
        <LanguageFontWrapper>
          <Card>
            <div className="flex flex-col items-center p-8">
              <h1 className="mb-4 text-4xl font-semibold">
                {t("WelcomeMessage")}
              </h1>
              <p className="text-center ">{t("Description")}</p>
            </div>
            <ThemeModeToggle />
            <LocaleToggle />
          </Card>
        </LanguageFontWrapper>
      </main>
    </div>
  );
}
