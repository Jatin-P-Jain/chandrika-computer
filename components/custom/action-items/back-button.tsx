"use client";

import { useSafeRouter } from "@/hooks/useSafeRouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function BackButton() {
  const { back } = useSafeRouter();
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  const handleBack = () => {
    if (isNavigatingBack) return;
    setIsNavigatingBack(true);
    back();
  };

  return (
    <Button
      variant="outline"
      className="w-[40%]"
      onClick={handleBack}
      disabled={isNavigatingBack}
    >
      {isNavigatingBack ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" /> Back
        </span>
      ) : (
        "👈🏻 Back"
      )}
    </Button>
  );
}
