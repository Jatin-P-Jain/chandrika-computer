import { ServicesGate } from "@/components/custom/sections/services-gate";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

type Props = {
  params: { locale: string };
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sessionExpired?: string }>;
}) {
  const { sessionExpired } = await searchParams;

  return (
    <div className="flex justify-center items-center w-full mt-30 mb-26">
      <ServicesGate sessionExpired={sessionExpired} />
    </div>
  );
}
