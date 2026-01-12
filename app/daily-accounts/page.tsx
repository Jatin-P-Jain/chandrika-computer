import DailyAccountsList from "@/components/custom/daily-accounts-list/daily-account-list";
import DailyAccountListHeader from "@/components/custom/daily-accounts-list/daily-account-list-header";
import { MobileFilters } from "@/components/custom/mobile-filters";

type Props = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const DailyAccounts = async ({ searchParams }: Props) => {
  const searchParamsValues = await searchParams;
  return (
    <div className="flex flex-col justify-center items-center w-full mt-28 md:mt-18 mb-20 md:mb-16 gap-2 max-w-6xl mx-auto">
      <DailyAccountListHeader />
      <MobileFilters />
      <DailyAccountsList searchParamsValues={searchParamsValues} />
    </div>
  );
};

export default DailyAccounts;
