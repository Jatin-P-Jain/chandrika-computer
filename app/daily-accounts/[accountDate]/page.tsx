// app/daily-account/page.tsx
import DailyPage from "@/components/custom/daily-page/daily-page";
import { DayNavigator } from "@/components/custom/date-navigator";
import { DailyFormValues } from "@/schema/dailay-page.schema";
import { getDailyAccountItem } from "../actions";
import DailyAccountHeader from "../daily-account-header";
import { clsx } from "clsx";

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
  let mode: "create" | "view" | "edit" = "create";

  if (docId) {
    const { data } = await getDailyAccountItem(docId);
    if (data) {
      // if you later want explicit edit mode via query, you can use searchParams.mode
      const { mode: modeParam } = await searchParams;
      mode = modeParam === "edit" ? "edit" : "view";
      initialData = data;
    }
    // if not found, mode stays "create" and form is empty
  }

  return (
    <div className="flex flex-col justify-center items-center w-full mt-28 md:mt-18 mb-20 md:mb-16 gap-2">
      <DailyAccountHeader />
      <DayNavigator />
      <div
        className={clsx(
          "flex w-full md:p-6 overflow-auto max-h-[calc(100vh-13rem-5rem)] no-scrollbar rounded-3xl",
          mode === "view" ? "p-3" : "p-2"
        )}
      >
        <DailyPage mode={mode} initialData={initialData} docId={docId} />
      </div>
    </div>
  );
};

export default DailyAccountPage;
