import { Suspense } from "react";
import { getStampReadings } from "../daily-accounts/readings-actions";
import { StampRegisterClient } from "./stamp-register-client";
import { StampRegisterSkeleton } from "./stamp-register-skeleton";

export default async function Page() {
  const stampReadingPromise = getStampReadings();

  return (
    <Suspense fallback={<StampRegisterSkeleton />}>
      <StampRegisterClient stampReadingPromise={stampReadingPromise} />
    </Suspense>
  );
}
