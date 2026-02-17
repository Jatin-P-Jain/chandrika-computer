"use client";

import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";

interface AddLineItemButtonProps {
  onAdd: () => void;
  buttonText: string;
  className?: string;
  disabled?: boolean;
}

export function AddLineItemButton({
  onAdd,
  buttonText,
  className,
  disabled = false,
}: AddLineItemButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      disabled={disabled}
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
