import DailyPage from "@/components/custom/daily-page/daily-page";
import { DayNavigator } from "@/components/custom/date-navigator";
import DailyAccountHeader from "./daily-account-header";

const DailyAccountPage = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full mt-28 md:mt-18 mb-20 md:mb-16 gap-2 overflow-auto">
      <DailyAccountHeader />
      <DayNavigator />
      <div className="flex w-full p-2 md:p-6">
        <DailyPage />
      </div>
    </div>
  );
};

export default DailyAccountPage;
