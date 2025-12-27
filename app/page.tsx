import clsx from "clsx";
import { ServicesGate } from "@/components/custom/sections/services-gate";

export default function Home() {
  return (
    <div className={clsx("flex items-center justify-center")}>
      <main className="flex w-full max-w-6xl flex-col items-center justify-between p-4 md:p-12 lg:p-16">
        <ServicesGate />
      </main>
    </div>
  );
}
