// app/daily-account/page.tsx
import { DailyFormValues } from "@/schema/daily-page.schema";
import { getDailyAccountItem } from "../read-actions";
import DailyAccountHeader from "../daily-account-header";
import { clsx } from "clsx";
import { DailyAccountDayNavigator } from "@/components/custom/daily-account-day-navigator";
import { DailyAccount } from "@/types/daily-account";
import { getReadings } from "../readings-actions";
import dynamic from "next/dynamic";

const DailyPage = dynamic(
  () => import("@/components/custom/daily-page/daily-page"),
  {
    loading: () => (
      <div className="w-full min-h-[60vh] animate-pulse rounded-md border bg-muted/20" />
    ),
  },
);

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
      initialData = data as unknown as DailyFormValues;
      dailyItemData = data;
    }
  }

  const readings = await getReadings(docId);

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <DailyAccountHeader />
      <DailyAccountDayNavigator docId={docId} />
      <div
        className={clsx(
          "flex w-full overflow-auto max-h-[calc(100vh-13rem)] no-scrollbar rounded-md p-1 md:p-2",
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
