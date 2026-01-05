import { ServicesGate } from "@/components/custom/sections/services-gate";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

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
    <div className="flex justify-center items-center w-full mt-30 mb-26">
      <ServicesGate sessionExpired={sessionExpired} />
    </div>
  );
}
