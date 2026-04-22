"use client";

import { useSafeRouter } from "@/hooks/useSafeRouter";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const { back } = useSafeRouter();

  return (
    <Button variant="outline" className="w-[40%]" onClick={() => back()}>
      👈🏻 Back
    </Button>
  );
}
