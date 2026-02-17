// app/daily-account/page.tsx
import { DailyFormValues } from "@/schema/daily-page.schema";
import { getDailyAccountItem } from "../actions";
import DailyAccountHeader from "../daily-account-header";
import { clsx } from "clsx";
import { DailyAccountDayNavigator } from "@/components/custom/daily-account-day-navigator";
import { DailyAccount } from "@/types/daily-account";
import { getReadings } from "../readings-actions";
import DailyPage from "@/components/custom/daily-page/daily-page";

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
      const { mode: modeParam } = await searchParams;
      mode = modeParam === "edit" ? "edit" : "view";
      initialData = data;
      dailyItemData = data;
    }
  }

  const readings = docId
    ? await getReadings(docId)
    : { photocopy: null, stamp: null };

  return (
    <div className="flex flex-col justify-center items-center w-full mt-28 md:mt-18 gap-1 max-w-7xl mx-auto">
      <DailyAccountHeader />
      <DailyAccountDayNavigator docId={docId} />
      <div
        className={clsx(
          "flex w-full overflow-auto max-h-[calc(100vh-14rem)] no-scrollbar rounded-md p-0",
          mode === "view" ? "shadow-md" : "",
        )}
      >
        <DailyPage
          docId={docId}
          mode={mode}
          initialData={initialData}
          dailyItemData={dailyItemData}
          readings={readings}
        />
      </div>
    </div>
  );
};

export default DailyAccountPage;
