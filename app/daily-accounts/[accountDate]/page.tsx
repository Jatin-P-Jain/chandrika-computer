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
  const { mode: modeParam } = await searchParams;

  let initialData: DailyFormValues | undefined;
  let dailyItemData: DailyAccount | undefined;
  let mode: "create" | "view" | "edit" = "create";

  if (docId) {
    const { data } = await getDailyAccountItem(docId);
    if (data) {
      const hasRealAccountOwner = Boolean(data.createdBy?.uid);
      mode = hasRealAccountOwner
        ? modeParam === "edit"
          ? "edit"
          : "view"
        : "create";
      initialData = data as unknown as DailyFormValues;
      dailyItemData = data;
    }
  }

  const readings = await getReadings(docId);

  return (
    <div className="flex flex-col justify-center items-center w-full gap-1">
      <DailyAccountHeader />
      <DailyAccountDayNavigator docId={docId} />
      <div
        className={clsx(
          "flex w-full overflow-auto max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-13rem)] no-scrollbar p-0.5 md:p-2 border-0",
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
