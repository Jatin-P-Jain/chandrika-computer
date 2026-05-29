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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus } from "lucide-react";
import { useDrawerBackButton } from "@/hooks/useDrawerBackButton";

export type ReviewItem = {
  id: string;
  title: string;
  description?: string;
  /** Renders a small badge next to the title instead of "(n)" in the string */
  count?: number;
  /** When true the description is styled green (section is complete / filled) */
  filled?: boolean;
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
  isSaving = false,
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
  isSaving?: boolean;
}) {
  const [checkedIds, setCheckedIds] = React.useState<Record<string, boolean>>(
    {},
  );
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(
    null,
  );

  const handleBackClose = React.useCallback(() => {
    if (!isSaving) onOpenChange(false);
  }, [isSaving, onOpenChange]);
  useDrawerBackButton(open, handleBackClose);

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
    <AlertDialog open={open} onOpenChange={isSaving ? undefined : onOpenChange}>
      <AlertDialogContent className=" max-h-[90vh] flex flex-col p-3">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <div className="space-y-2 overflow-y-auto min-h-0 flex-1 no-scrollbar">
          {items.map((it) => {
            const checked = checkedIds[it.id] === true;

            return (
              <div
                key={it.id}
                className="rounded-md border p-2 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">{it.title}</span>
                      {it.count !== undefined ? (
                        <Badge
                          variant={it.filled ? "default" : "secondary"}
                          className="h-4 px-1.5 text-[10px] font-semibold rounded-full"
                        >
                          {it.count}
                        </Badge>
                      ) : null}
                      {it.onAction && it.actionLabel ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 p-1.5 text-xs! gap-0.5 font-medium border text-primary hover:bg-primary/5 ml-auto"
                          onClick={async () => {
                            if (!it.onAction || pendingActionId === it.id)
                              return;
                            setPendingActionId(it.id);
                            try {
                              await it.onAction();
                            } finally {
                              setPendingActionId(null);
                            }
                          }}
                          disabled={pendingActionId === it.id}
                        >
                          {pendingActionId === it.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                          {it.actionLabel}
                        </Button>
                      ) : null}
                    </div>
                    {it.description ? (
                      <div
                        className={`text-xs ${
                          it.filled
                            ? "text-primary dark:text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
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
          <AlertDialogCancel type="button" disabled={isSaving}>
            {cancelText}
          </AlertDialogCancel>

          {!hideConfirm && (
            <AlertDialogAction
              type="button"
              disabled={!allChecked || isSaving}
              onClick={(e) => {
                e.preventDefault();
                if (!allChecked || isSaving) return;
                onConfirm();
              }}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {confirmText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
