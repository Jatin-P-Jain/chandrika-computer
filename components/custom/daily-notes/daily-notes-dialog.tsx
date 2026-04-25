"use client";

import * as React from "react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Loader2,
  Plus,
  Undo2,
  X,
  XCircle,
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
import { UseFormReturn, useWatch } from "react-hook-form";
import { DailyFormValues } from "@/schema/daily-page.schema";
import type { NoteItem, NoteItemStatus } from "@/types/daily-notes";
import { noteItemTextSchema } from "@/schema/daily-notes-schema";
import { useAuth } from "@/context/useAuth";
import {
  addNoteItem,
  updateNoteStatus,
  dismissNote,
  undoDismissNote,
} from "@/app/daily-accounts/notes-actions";

type Props = {
  form: UseFormReturn<DailyFormValues>;
  docId: string; // Required: document ID for independent persistence
  readOnly?: boolean;
  startOpen?: boolean;
};

function sortItems(items: NoteItem[]) {
  const rank = (s: NoteItemStatus) => (s === "open" ? 0 : s === "done" ? 1 : 2);
  return [...items].sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

function makeId() {
  // simple stable id; fine for client-only draft items
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function DailyNotesDialog({
  form,
  docId,
  readOnly = false,
  startOpen = false,
}: Props) {
  const tNotes = useTranslations("Notes");
  const [open, setOpen] = React.useState(startOpen);
  const { authState } = useAuth();

  const { control, setValue } = form;
  const watchedNotes = useWatch({ control, name: "notes" });
  const notes = React.useMemo(() => watchedNotes ?? [], [watchedNotes]);

  // Loading states per operation
  const [savingNoteId, setSavingNoteId] = React.useState<string | null>(null);
  const [addingNote, setAddingNote] = React.useState(false);

  // add-item composer
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  // dismissed collapsible
  const [dismissedOpen, setDismissedOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setComposerOpen(false);
    setDraft("");
    setDismissedOpen(false);
  }, [open]);

  const items = React.useMemo(() => sortItems(notes), [notes]);

  const startAdd = () => {
    if (readOnly) return;
    setComposerOpen(true);
  };

  const discardAdd = () => {
    setComposerOpen(false);
    setDraft("");
  };

  const commitAdd = async () => {
    if (readOnly || authState.status !== "ready") return;

    const parsed = noteItemTextSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid");
      return;
    }

    setAddingNote(true);

    const now = new Date();
    const newItem: NoteItem = {
      id: makeId(),
      text: parsed.data,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };

    // Update local state optimistically
    const updatedNotes = [...notes, newItem];
    setValue("notes", updatedNotes, {
      shouldDirty: true,
      shouldValidate: true,
    });

    // Save to database
    const token = await authState.currentUser?.getIdToken();
    if (!token) {
      toast.error("Authentication failed");
      setAddingNote(false);
      return;
    }

    const result = await addNoteItem(
      docId,
      newItem,
      authState.clientUser,
      token,
    );

    setAddingNote(false);

    if (!result.success) {
      toast.error("Error", {
        description: result.error || "Failed to save note",
      });
      // Revert optimistic update
      setValue("notes", notes, { shouldDirty: false });
      return;
    }

    // ✅ Success: close composer, keep dialog open, clear draft
    toast.success("Success", { description: "Note saved" });
    setComposerOpen(false);
    setDraft("");
    // Dialog stays open - user can add more notes
  };

  const toggleCheckbox = async (item: NoteItem) => {
    if (readOnly || authState.status !== "ready") return;

    const nextStatus: NoteItemStatus =
      item.status === "dismissed"
        ? "open"
        : item.status === "open"
          ? "done"
          : "open";

    setSavingNoteId(item.id);

    // Update local state optimistically
    const now = new Date();
    const next = notes.map((x) =>
      x.id === item.id ? { ...x, status: nextStatus, updatedAt: now } : x,
    );
    setValue("notes", next, { shouldDirty: true, shouldValidate: true });

    // Save to database
    const token = await authState.currentUser?.getIdToken();
    if (!token) {
      toast.error("Authentication failed");
      setSavingNoteId(null);
      return;
    }

    const result = await updateNoteStatus(
      docId,
      item.id,
      nextStatus,
      authState.clientUser,
      token,
    );

    if (!result.success) {
      toast.error("Error updating note");
      // Revert optimistic update
      setValue("notes", notes, { shouldDirty: false });
    }

    setSavingNoteId(null);
  };

  const dismiss = async (item: NoteItem) => {
    if (readOnly || authState.status !== "ready") return;

    setSavingNoteId(item.id);

    // Update local state optimistically
    const now = new Date();
    const next = notes.map((x) =>
      x.id === item.id
        ? { ...x, status: "dismissed" as NoteItemStatus, updatedAt: now }
        : x,
    );
    setValue("notes", next, { shouldDirty: true, shouldValidate: true });

    // Save to database
    const token = await authState.currentUser?.getIdToken();
    if (!token) {
      toast.error("Authentication failed");
      setSavingNoteId(null);
      return;
    }

    const result = await dismissNote(
      docId,
      item.id,
      authState.clientUser,
      token,
    );

    if (!result.success) {
      toast.error("Error dismissing note");
      // Revert optimistic update
      setValue("notes", notes, { shouldDirty: false });
    }

    setSavingNoteId(null);
  };

  const undoDismiss = async (item: NoteItem) => {
    if (readOnly || authState.status !== "ready") return;

    setSavingNoteId(item.id);

    // Update local state optimistically
    const now = new Date();
    const next = notes.map((x) =>
      x.id === item.id
        ? { ...x, status: "open" as NoteItemStatus, updatedAt: now }
        : x,
    );
    setValue("notes", next, { shouldDirty: true, shouldValidate: true });

    // Save to database
    const token = await authState.currentUser?.getIdToken();
    if (!token) {
      toast.error("Authentication failed");
      setSavingNoteId(null);
      return;
    }

    const result = await undoDismissNote(
      docId,
      item.id,
      authState.clientUser,
      token,
    );

    if (!result.success) {
      toast.error("Error restoring note");
      // Revert optimistic update
      setValue("notes", notes, { shouldDirty: false });
    }

    setSavingNoteId(null);
  };

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
          className={clsx("bg-primary/5 text-primary font-medium! gap-1 border", notes.length > 0 && "ring-1 ring-primary")}
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
          {!readOnly ? (
            !composerOpen ? (
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  className="gap-2 text-sm!"
                  onClick={startAdd}
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
                    onClick={discardAdd}
                    disabled={addingNote}
                    className="gap-2"
                    size={"icon-sm"}
                  >
                    <X className="size-4" />
                  </Button>
                  <Button
                    onClick={commitAdd}
                    disabled={addingNote}
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
            )
          ) : null}

          {/* Active list (open + done) */}
          <div className="space-y-2 max-h-[45vh] overflow-auto no-scrollbar">
            {activeItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {tNotes("NoMemoryItems")}
              </div>
            ) : (
              activeItems.map((item) => {
                const isDone = item.status === "done";
                const isSaving = savingNoteId === item.id;
                return (
                  <div
                    key={item.id}
                    className={clsx(
                      "rounded-md border px-2 flex items-start justify-between gap-3",
                      isSaving && "opacity-60",
                    )}
                  >
                    <label className="flex items-start py-2 justify-center gap-3 w-full">
                      <div className="relative">
                        <Checkbox
                          checked={isDone}
                          disabled={readOnly || isSaving}
                          onCheckedChange={() => toggleCheckbox(item)}
                          className=""
                        />
                        {isSaving && (
                          <Loader2 className="absolute inset-0 size-4 animate-spin" />
                        )}
                      </div>
                      <span
                        className={clsx(
                          "text-sm leading-5 w-full",
                          isDone && "text-muted-foreground",
                        )}
                      >
                        {item.text}
                      </span>
                    </label>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Dismiss"
                      onClick={() => dismiss(item)}
                      disabled={readOnly || isSaving}
                      className="shrink-0"
                      title={readOnly ? undefined : "Dismiss"}
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <XCircle className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Dismissed collapsible */}
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
                  {dismissedItems.map((item) => {
                    const isSaving = savingNoteId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={clsx(
                          "rounded-md border px-2 flex items-start justify-between gap-3",
                          isSaving && "opacity-60",
                        )}
                      >
                        <label className="flex items-start py-2 justify-center gap-3 w-full">
                          <div className="relative">
                            <Checkbox
                              checked={false}
                              disabled={readOnly || isSaving}
                              onCheckedChange={() => toggleCheckbox(item)}
                            />
                            {isSaving && (
                              <Loader2 className="absolute inset-0 size-4 animate-spin" />
                            )}
                          </div>
                          <span className="text-sm leading-5 w-full line-through text-muted-foreground">
                            {item.text}
                          </span>
                        </label>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Undo Dismiss"
                          onClick={() => undoDismiss(item)}
                          disabled={readOnly || isSaving}
                          className="shrink-0"
                          title={readOnly ? undefined : "Undo Dismiss"}
                        >
                          {isSaving ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Undo2 className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
