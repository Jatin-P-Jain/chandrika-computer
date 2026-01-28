"use client";

import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";

interface AddLineItemButtonProps {
  onAdd: () => void;
  buttonText: string;
  className?: string;
}

export function AddLineItemButton({
  onAdd,
  buttonText,
  className,
}: AddLineItemButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onAdd}
      className={
        className || "w-full flex justify-center items-center gap-2 shadow-md"
      }
    >
      {buttonText}
      <ListPlus />
    </Button>
  );
}
