import { LayoutList } from "lucide-react";

const DailyAccounts = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full mt-28 md:mt-18 mb-20 md:mb-16 gap-2">
      <div className="flex justify-between items-center w-full">
        <h1 className="flex justify-center items-center gap-1 font-semibold text-primary text-lg md:text-xl">
          <LayoutList className="size-4 md:size-5" />
          All Daily Accounts
        </h1>
      </div>
      <div className="flex bg-white p-2 w-full rounded-md">Filters Section</div>
      <div className="flex w-full p-2 md:p-6 overflow-auto max-h-[calc(100vh-13rem-5rem)] no-scrollbar rounded-3xl">
        <div className="flex">All your daily accounts will be listed here</div>
      </div>
    </div>
  );
};

export default DailyAccounts;
