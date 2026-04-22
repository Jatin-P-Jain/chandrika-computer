"use client";

import * as React from "react";
import clsx from "clsx";
import { ChevronDown, ChevronUp, ListTodo } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useTranslations } from "next-intl";
import type { NoteItem, NoteItemStatus } from "@/types/daily-notes";

type Props = {
  notes: NoteItem[];
  startOpen?: boolean;
};

function sortItems(items: NoteItem[]) {
  const rank = (s: NoteItemStatus) => (s === "open" ? 0 : s === "done" ? 1 : 2);
  return [...items].sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;

    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
}

export default function DailyNotesReadOnlyDialog({
  notes,
  startOpen = false,
}: Props) {
  const tNotes = useTranslations("Notes");
  const [open, setOpen] = React.useState(startOpen);
  const [dismissedOpen, setDismissedOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDismissedOpen(false);
  }, [open]);

  const items = React.useMemo(() => sortItems(notes ?? []), [notes]);

  const activeItems = React.useMemo(
    () => items.filter((i) => i.status !== "dismissed"),
    [items],
  );

  const dismissedItems = React.useMemo(
    () => items.filter((i) => i.status === "dismissed"),
    [items],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={clsx("shadow-md font-medium!")}>
          <ListTodo className="size-4" /> {tNotes("Notes")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>{tNotes("Notes")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2 max-h-[45vh] overflow-auto no-scrollbar">
            {activeItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {tNotes("NoMemoryItems")}
              </div>
            ) : (
              activeItems.map((item) => {
                const isDone = item.status === "done";
                return (
                  <div
                    key={item.id}
                    className="rounded-md border px-2 flex items-start justify-between gap-3"
                  >
                    <label className="flex items-start py-2 justify-center gap-3 w-full">
                      <Checkbox checked={isDone} disabled={true} />
                      <span
                        className={clsx(
                          "text-sm leading-5 w-full",
                          isDone && "text-muted-foreground",
                        )}
                      >
                        {item.text}
                      </span>
                    </label>
                  </div>
                );
              })
            )}
          </div>

          {dismissedItems.length > 0 ? (
            <Collapsible open={dismissedOpen} onOpenChange={setDismissedOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer justify-between w-full">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground text-xs! p-0!"
                      size={"sm"}
                    >
                      {tNotes("Dismissed")} ({dismissedItems.length})
                    </Button>
                    <span className="text-muted-foreground text-xs">
                      {dismissedOpen ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  </div>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="mt-2 space-y-2 max-h-40 overflow-auto no-scrollbar">
                  {dismissedItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border px-2 flex items-start justify-between gap-3"
                    >
                      <label className="flex items-start py-2 justify-center gap-3 w-full">
                        <Checkbox checked={false} disabled={true} />
                        <span className="text-sm leading-5 w-full line-through text-muted-foreground">
                          {item.text}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
