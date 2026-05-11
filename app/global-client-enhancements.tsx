"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), {
  ssr: false,
});
const DateTimeDisplay = dynamic(
  () =>
    import("@/components/custom/date-time-display").then(
      (mod) => mod.DateTimeDisplay,
    ),
  { ssr: false },
);
const NextTopLoader = dynamic(() => import("nextjs-toploader"), {
  ssr: false,
});
const ServiceWorkerRegister = dynamic(
  () =>
    import("./service-worker-register").then(
      (mod) => mod.ServiceWorkerRegister,
    ),
  { ssr: false },
);
const NetworkBanner = dynamic(
  () => import("@/components/custom/network-banner"),
  { ssr: false },
);

export function GlobalClientEnhancements() {
  return (
    <>
      <ServiceWorkerRegister />
      <NetworkBanner />
      <NextTopLoader color="#065884" height={4} showSpinner={false} />
      <DateTimeDisplay />
      <Toaster
        closeButton
        richColors
        position="top-center"
        mobileOffset={{ top: "calc(env(safe-area-inset-top) + 85px)" }}
        className="flex justify-center"
        toastOptions={{
          classNames: {
            toast:
              "mx-auto w-[min(100vw,300px)]! min-h-14! flex items-start gap-2 px-4! py-3!",
            title: "font-semibold leading-snug text-base",
            description: "text-sm leading-snug text-muted-foreground",
          },
        }}
      />
    </>
  );
}
