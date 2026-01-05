import DailyPage from "@/components/custom/daily-page/daily-page";
import { DayNavigator } from "@/components/custom/date-navigator";
import { ClipboardListIcon, LayoutList } from "lucide-react";

const DailyAccountPage = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full mt-26 mb-20 gap-3 overflow-auto max-h-[80vh]">
      <div className="flex justify-between items-center w-full">
        <h1 className="flex justify-center items-center gap-1 font-semibold text-primary text-lg">
          <ClipboardListIcon className="size-5" />
          Daily Accounts
        </h1>
        <div className="flex gap-2 justify-between items-center font-semibold text-sm text-primary ">
          View All
          <LayoutList className="size-4" />
        </div>
      </div>
      <DayNavigator />

      <DailyPage />
    </div>
  );
};

export default DailyAccountPage;
