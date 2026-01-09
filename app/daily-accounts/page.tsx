import DailyAccountsList from "@/components/custom/daily-accounts-list/daily-account-list";
import { Button } from "@/components/ui/button";
import { toDocId } from "@/lib/utils";
import { LayoutList, PlusCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const DailyAccounts = async ({ searchParams }: Props) => {
  const searchParamsValues = await searchParams;
  return (
    <div className="flex flex-col justify-center items-center w-full mt-28 md:mt-18 mb-20 md:mb-16 gap-2 max-w-7xl mx-auto">
      <div className="flex justify-between lg:justify-start items-center w-full gap-4">
        <h1 className="flex justify-center items-center gap-1 font-semibold text-primary text-lg md:text-xl">
          <LayoutList className="size-4 md:size-5" />
          All Daily Accounts
        </h1>
        <Button
          asChild
          size={"sm"}
          variant={"outline"}
          className="border shadow-lg border-primary text-primary font-bold -tracking-normal hover:bg-primary hover:text-white"
        >
          <Link href={`/daily-accounts/${toDocId()}`}>
            Create <PlusCircle className="size-5" />
          </Link>
        </Button>
        <div className="hidden lg:flex bg-white p-2 rounded-md ml-auto">
          Filters Section
        </div>
      </div>
      <div className="flex lg:hidden bg-white p-2 w-full rounded-md">
        Filters Section
      </div>
      <DailyAccountsList searchParamsValues={searchParamsValues} />
    </div>
  );
};

export default DailyAccounts;
