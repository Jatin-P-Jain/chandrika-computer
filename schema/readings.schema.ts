// schema/readings.schema.ts
import { z } from "zod";
type TFunction = (key: string) => string;

const zNumberFromInput = (t?: TFunction, min = 0) =>
  z.number().min(min, t ? t("NonNegative") : "Errors.nonNegative");

export const makePhotocopyReadingSchema = (t?: TFunction) => {
  return z.object({
    todayReading: zNumberFromInput(t, 0),
  });
};

export type PhotocopyFormValues = z.infer<
  ReturnType<typeof makePhotocopyReadingSchema>
>;
export const photocopyReadingSchema = makePhotocopyReadingSchema();

export const makeStampReadingSchema = (t?: TFunction) => {
  return z.object({
    r50: zNumberFromInput(t, 0),
    r100: zNumberFromInput(t, 0),
    r500: zNumberFromInput(t, 0),
    r1000: zNumberFromInput(t, 0),
  });
};

export type StampFormValues = z.infer<
  ReturnType<typeof makeStampReadingSchema>
>;
export const stampReadingSchema = makeStampReadingSchema();

export const makeStampStockAdditionSchema = (t?: TFunction) => {
  return z.object({
    s50: zNumberFromInput(t, 0),
    s100: zNumberFromInput(t, 0),
    s500: zNumberFromInput(t, 0),
    s1000: zNumberFromInput(t, 0),
  });
};

export type StampStockAdditionFormValues = z.infer<
  ReturnType<typeof makeStampStockAdditionSchema>
>;
export const stampStockAdditionSchema = makeStampStockAdditionSchema();
