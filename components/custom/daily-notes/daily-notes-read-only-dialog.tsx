"use client";

import * as React from "react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ListTodo,
  Plus,
  X,
  Check,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useTranslations } from "next-intl";
import { useAuth } from "@/context/useAuth";
import type { NoteItem, NoteItemStatus } from "@/types/daily-notes";
import { addNoteItem } from "@/app/daily-accounts/notes-actions";

type Props = {
  notes: NoteItem[];
  onNotesUpdated?: (notes: NoteItem[]) => void;
  docId?: string;
  startOpen?: boolean;
};

function makeId() {
  // simple stable id; fine for client-only draft items
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

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
  onNotesUpdated,
  docId,
  startOpen = false,
}: Props) {
  const tNotes = useTranslations("Notes");
  const { authState } = useAuth();
  const [open, setOpen] = React.useState(startOpen);
  const [dismissedOpen, setDismissedOpen] = React.useState(false);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [addingNote, setAddingNote] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setComposerOpen(false);
    setDraft("");
    setDismissedOpen(false);
  }, [open]);

  const handleAddNote = async () => {
    if (!draft.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    if (!docId) {
      toast.error("Document ID is required");
      return;
    }

    try {
      setAddingNote(true);
      const now = new Date();
      const newItem: NoteItem = {
        id: makeId(),
        text: draft.trim(),
        status: "open" as const,
        createdAt: now,
        updatedAt: now,
      };

      // Update local state optimistically
      const updatedNotes = [...notes, newItem];
      onNotesUpdated?.(updatedNotes);
      setDraft("");
      setComposerOpen(false);

      // Save to database
      if (authState.status !== "ready") {
        toast.error("Authentication required");
        setAddingNote(false);
        return;
      }

      const token = await authState.currentUser.getIdToken();

      const result = await addNoteItem(
        docId,
        newItem,
        authState.clientUser,
        token,
      );

      if (!result.success) {
        toast.error("Error", {
          description: result.error || "Failed to save note",
        });
      } else {
        toast.success("Note added");
      }
    } catch (e) {
      toast.error("Failed to add note", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setAddingNote(false);
    }
  };

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
        <Button
          variant="secondary"
          className={clsx(
            "bg-primary/5 text-primary font-medium! gap-1 border",
            notes.length > 0 && "ring-1 ring-primary",
          )}
        >
          <ListTodo className="size-4" /> {tNotes("Notes")}
          {notes.length > 0 && (
            <Badge variant="default" className="size-4">
              {notes.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>{tNotes("Notes")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {!composerOpen ? (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                className="gap-2 text-sm!"
                onClick={() => setComposerOpen(true)}
                disabled={addingNote}
                size={"sm"}
              >
                <Plus className="size-4" /> {tNotes("AddMemoryItem")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={tNotes("MemoryItemPlaceholder")}
                className="min-h-22.5 max-h-80"
                disabled={addingNote}
              />
              <div className="flex flex-row justify-end md:flex-col md:justify-between items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setComposerOpen(false);
                    setDraft("");
                  }}
                  disabled={addingNote}
                  className="gap-2"
                  size={"icon-sm"}
                >
                  <X className="size-4" />
                </Button>
                <Button
                  onClick={handleAddNote}
                  disabled={addingNote || !draft.trim()}
                  className="gap-2"
                  size={"icon-sm"}
                >
                  {addingNote ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

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
