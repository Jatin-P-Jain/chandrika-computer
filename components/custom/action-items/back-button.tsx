"use client";

import { useRouter } from "nextjs-toploader/app";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button variant="outline" className="w-[40%]" onClick={() => router.back()}>
      👈🏻 Back
    </Button>
  );
}
