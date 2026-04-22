import { HomePage } from "@/components/custom/sections/home-page";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

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

  return <HomePage sessionExpired={sessionExpired} />;
}
