import clsx from "clsx";
import { ServicesGate } from "@/components/custom/sections/services-gate";
import { getLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { DateTimeDisplay } from "@/components/custom/date-time-display";

type Props = {
  params: { locale: string; sessionExpired?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;

  const tCommon = await getTranslations({
    locale,
    namespace: "Common",
  });
  const tHomePage = await getTranslations({
    locale,
    namespace: "HomePage",
  });

  return {
    title: tCommon("ChandrikaComputer"),
    description: tHomePage("Description"),
  };
}

export default function Home({ params }: Props) {
  const { sessionExpired } = params;
  return (
    <div className={clsx("flex items-center justify-center")}>
      <main className="flex w-full max-w-6xl flex-col items-center justify-between p-4 md:p-12 lg:p-16">
        <DateTimeDisplay />
        <ServicesGate sessionExpired={sessionExpired} />
      </main>
    </div>
  );
}
