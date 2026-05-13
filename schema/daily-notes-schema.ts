// schema/daily-notes.schema.ts
import { z } from "zod";

export const noteItemTextSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(500, "Too long");

export const noteItemStatusSchema = z.enum(["open", "done", "dismissed"]);

export const noteItemSchema = z.object({
  id: z.string().min(1),
  text: noteItemTextSchema,
  status: noteItemStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const dailyNoteDocSchema = z.object({
  docId: z.string().min(1),
  items: z.array(noteItemSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DailyNoteDocInput = z.infer<typeof dailyNoteDocSchema>;
