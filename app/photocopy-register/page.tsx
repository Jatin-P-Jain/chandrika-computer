import { Suspense } from "react";
import { getPhotocopyReadings } from "../daily-accounts/readings-actions";
import { PhotocopyRegisterClient } from "./photocopy-register-client";
import { PhotocopyRegisterSkeleton } from "./photocopy-register-skeleton";

export default async function Page() {
  const photocopyReadingPromise = getPhotocopyReadings();

  return (
    <Suspense fallback={<PhotocopyRegisterSkeleton />}>
      <PhotocopyRegisterClient
        photocopyReadingPromise={photocopyReadingPromise}
      />
    </Suspense>
  );
}
