// app/daily-account/page.tsx
import DailyPage from "@/components/custom/daily-page/daily-page";
import { DailyFormValues } from "@/schema/dailay-page.schema";
import { getDailyAccountItem } from "../actions";
import DailyAccountHeader from "../daily-account-header";
import { clsx } from "clsx";
import { DailyAccountDayNavigator } from "@/components/custom/daily-account-day-navigator";
import { DailyAccount } from "@/types/daily-account";

type Props = {
  params: Promise<{
    accountDate: string;
  }>;
  searchParams: Promise<{
    mode?: string; // optional: "edit" or "view"
  }>;
};

const DailyAccountPage = async ({ params, searchParams }: Props) => {
  const { accountDate: docId } = await params;

  let initialData: DailyFormValues | undefined;
  let dailyItemData: DailyAccount | undefined;
  let mode: "create" | "view" | "edit" = "create";

  if (docId) {
    const { data } = await getDailyAccountItem(docId);
    if (data) {
      // if you later want explicit edit mode via query, you can use searchParams.mode
      const { mode: modeParam } = await searchParams;
      mode = modeParam === "edit" ? "edit" : "view";
      initialData = data;
      dailyItemData = data;
    }
  }

  return (
    <div className="flex flex-col justify-center items-center w-full mt-28 md:mt-18 mb-20 md:mb-16 gap-2">
      <DailyAccountHeader />
      <DailyAccountDayNavigator docId={docId} />
      <div
        className={clsx(
          "flex w-full md:p-6 overflow-auto max-h-[calc(100vh-13rem-5rem)] no-scrollbar rounded-3xl",
          mode === "view" ? "p-3" : "p-2"
        )}
      >
        <DailyPage
          mode={mode}
          initialData={initialData}
          dailyItemData={dailyItemData}
          docId={docId}
        />
      </div>
    </div>
  );
};

export default DailyAccountPage;
