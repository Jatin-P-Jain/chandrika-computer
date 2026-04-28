"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";

export type ReviewItem = {
  id: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SaveReviewDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  confirmText,
  cancelText,
  onConfirm,
  hideConfirm = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  items: ReviewItem[];
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  hideConfirm?: boolean;
}) {
  const [checkedIds, setCheckedIds] = React.useState<Record<string, boolean>>(
    {},
  );

  // Reset checks whenever dialog opens or item list changes
  React.useEffect(() => {
    if (!open) return;
    const next: Record<string, boolean> = {};
    for (const it of items) next[it.id] = false;
    setCheckedIds(next);
  }, [open, items]);

  const allChecked =
    items.length > 0 && items.every((it) => checkedIds[it.id] === true);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[95vw] md:max-w-4xl max-h-[90vh] flex flex-col">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <div className="space-y-2 overflow-y-auto min-h-0 flex-1 pr-1">
          {items.map((it) => {
            const checked = checkedIds[it.id] === true;

            return (
              <div
                key={it.id}
                className="rounded-md border p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-start ">
                      <div className="font-medium">{it.title}</div>
                      {it.onAction && it.actionLabel ? (
                        <Button
                          variant="link"
                          className="text-sm font-semibold"
                          onClick={it.onAction}
                          size="sm"
                        >
                          {it.actionLabel}{" "}
                          <PlusCircle className="ml-1 h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                    {it.description ? (
                      <div className="text-sm text-muted-foreground">
                        {it.description}
                      </div>
                    ) : null}
                  </div>
                </div>

                <Checkbox
                  className="size-8"
                  checkIcon={"👍🏻"}
                  checked={checked}
                  onCheckedChange={(v) =>
                    setCheckedIds((prev) => ({
                      ...prev,
                      [it.id]: v === true,
                    }))
                  }
                />
              </div>
            );
          })}
        </div>

        <AlertDialogFooter className="shrink-0">
          <AlertDialogCancel type="button">{cancelText}</AlertDialogCancel>

          {!hideConfirm && (
            <AlertDialogAction
              type="button"
              disabled={!allChecked}
              onClick={(e) => {
                e.preventDefault();
                if (!allChecked) return;
                onConfirm();
              }}
            >
              {confirmText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
