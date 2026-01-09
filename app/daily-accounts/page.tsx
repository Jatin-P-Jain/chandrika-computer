import DailyAccountsList from "@/components/custom/daily-accounts-list/daily-account-list";
import DailyAccountListHeader from "@/components/custom/daily-accounts-list/daily-account-list-header";

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
      <div className="flex lg:hidden bg-white p-2 w-full rounded-md">
        Filters Section
      </div>
      <DailyAccountsList searchParamsValues={searchParamsValues} />
    </div>
  );
};

export default DailyAccounts;
