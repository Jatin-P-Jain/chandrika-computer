// types/daily-notes.ts
export type NoteItemStatus = "open" | "done" | "dismissed";

export type NoteItem = {
  id: string;
  text: string;
  status: NoteItemStatus;
  createdAt: Date; // stored as Firestore Timestamp
  updatedAt: Date; // stored as Firestore Timestamp
};

export type DailyNoteDoc = {
  docId: string;
  items: NoteItem[];
  createdAt: Date; // stored as Firestore Timestamp
  updatedAt: Date; // stored as Firestore Timestamp
};
