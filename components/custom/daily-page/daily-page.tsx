"use client";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import clsx from "clsx";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// shadcn Input Group [web:47]
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";

import { DailyFormValues, dailySchema } from "@/schema/dailay-page.schema";
import { formatINR, parseINR } from "@/lib/utils";

function sumAmounts(items?: { amount?: number }[]) {
  return (items ?? []).reduce((acc, it) => acc + (Number(it?.amount) || 0), 0);
}

function LineItemRow({
  control,
  namePrefix,
  onRemove,
}: {
  control: any;
  namePrefix: string; // e.g. "earnings.0"
  onRemove: () => void;
}) {
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "font-[inherit]");

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-md border p-3">
      <FormField
        control={control}
        name={`${namePrefix}.label`}
        render={({ field }) => (
          <FormItem className="md:col-span-5">
            <FormLabel className={textCls}>Label</FormLabel>
            <FormControl>
              <Input placeholder="Enter label" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${namePrefix}.amount`}
        render={({ field }) => (
          <FormItem className="md:col-span-3">
            <FormLabel className={textCls}>Amount</FormLabel>
            <FormControl>
              <InputGroup className="focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <InputGroupAddon>₹</InputGroupAddon>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  {...field}
                  className={clsx(
                    "text-center",
                    "focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                  value={
                    field.value === 0
                      ? ""
                      : formatINR(Number(field.value), false, false)
                  }
                  onChange={(e) => field.onChange(parseINR(e.target.value))}
                />
                <InputGroupAddon align="inline-end">/-</InputGroupAddon>
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${namePrefix}.tag`}
        render={({ field }) => (
          <FormItem className="md:col-span-3">
            <FormLabel className={textCls}>
              Tag{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g. cash / upi / bank" {...field} />
            </FormControl>

            <div className="pt-2">
              {field.value ? (
                <Badge variant="secondary" className="rounded-md">
                  {String(field.value)}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">No tag</span>
              )}
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      <div className="md:col-span-1 flex md:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Remove row"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DailyPage() {
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "font-[inherit]");

  const form = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    defaultValues: {
      fixed: { sd: 0, sc: 0, fs: 0 },
      earnings: [],
      businessExpenses: [],
      dailySpends: [],
      totalCashCollected: 0,
    },
    mode: "onChange",
  });

  const earningsFA = useFieldArray({ control: form.control, name: "earnings" });
  const businessFA = useFieldArray({
    control: form.control,
    name: "businessExpenses",
  });
  const spendsFA = useFieldArray({
    control: form.control,
    name: "dailySpends",
  });

  const fixed = useWatch({ control: form.control, name: "fixed" });
  const earnings = useWatch({ control: form.control, name: "earnings" });
  const businessExpenses = useWatch({
    control: form.control,
    name: "businessExpenses",
  });
  const dailySpends = useWatch({ control: form.control, name: "dailySpends" });

  const totalFixed = (fixed?.sd ?? 0) + (fixed?.sc ?? 0) + (fixed?.fs ?? 0);
  const totalEarnings = sumAmounts(earnings);
  const totalBusiness = sumAmounts(businessExpenses);
  const totalSpends = sumAmounts(dailySpends);

  const netForDay = totalEarnings - (totalFixed + totalBusiness + totalSpends);

  const onSubmit = (values: DailyFormValues) => {
    console.log("Daily form submit:", values);
  };

  return (
    <Card className="w-full p-6 py-3 shadow-sm border rounded-md dark:bg-slate-800 gap-2 overflow-auto">
      <div
        className={clsx(
          "w-full text-center text-shadow-xs text-lg font-semibold font-script flex flex-col",
          textCls
        )}
      >
        <span className="text-base text-yellow-700">ॐ</span>
        <span className="text-orange-600"> श्री गणेशाय नमः</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Accordion
            type="multiple"
            className="w-full max-h-[40vh] overflow-auto no-scrollbar"
          >
            <AccordionItem value="fixed" className="pb-2">
              <AccordionTrigger
                className={clsx(
                  "text-base font-semibold py-2 text-primary",
                  textCls
                )}
              >
                Fixed Expenses / Charges
              </AccordionTrigger>

              <AccordionContent className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="fixed.sd"
                    render={({ field }) => (
                      <>
                        <FormItem className="flex">
                          <FormLabel className={clsx("w-full", textCls)}>
                            Stamp Duty (SD)
                          </FormLabel>
                          <FormControl>
                            <InputGroup className="focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                              <InputGroupAddon>₹</InputGroupAddon>
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                {...field}
                                className={clsx(
                                  "w-fit",
                                  "text-center border-0 shadow-none",
                                  "focus-visible:ring-0 focus-visible:ring-offset-0"
                                )}
                                value={
                                  field.value === 0
                                    ? ""
                                    : formatINR(
                                        Number(field.value),
                                        false,
                                        false
                                      )
                                }
                                onChange={(e) =>
                                  field.onChange(parseINR(e.target.value))
                                }
                              />
                              <InputGroupAddon align="inline-end">
                                /-
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                        </FormItem>
                        <FormMessage />
                      </>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fixed.sc"
                    render={({ field }) => (
                      <>
                        <FormItem className="flex">
                          <FormLabel className={clsx("w-full", textCls)}>
                            Sur Charge (SC)
                          </FormLabel>
                          <FormControl>
                            <InputGroup className="focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                              <InputGroupAddon>₹</InputGroupAddon>
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                {...field}
                                className={clsx(
                                  "w-fit",
                                  "text-center border-0 shadow-none",
                                  "focus-visible:ring-0 focus-visible:ring-offset-0"
                                )}
                                value={
                                  field.value === 0
                                    ? ""
                                    : formatINR(
                                        Number(field.value),
                                        false,
                                        false
                                      )
                                }
                                onChange={(e) =>
                                  field.onChange(parseINR(e.target.value))
                                }
                              />
                              <InputGroupAddon align="inline-end">
                                /-
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                        </FormItem>
                        <FormMessage />
                      </>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fixed.fs"
                    render={({ field }) => (
                      <>
                        <FormItem className="flex">
                          <FormLabel className={clsx("w-full", textCls)}>
                            Photocopy (FS)
                          </FormLabel>
                          <FormControl>
                            <InputGroup className="focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                              <InputGroupAddon>₹</InputGroupAddon>
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                {...field}
                                className={clsx(
                                  "w-fit",
                                  "text-center border-0 shadow-none",
                                  "focus-visible:ring-0 focus-visible:ring-offset-0"
                                )}
                                value={
                                  field.value === 0
                                    ? ""
                                    : formatINR(
                                        Number(field.value),
                                        false,
                                        false
                                      )
                                }
                                onChange={(e) =>
                                  field.onChange(parseINR(e.target.value))
                                }
                              />
                              <InputGroupAddon align="inline-end">
                                /-
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </>
                    )}
                  />
                </div>
              </AccordionContent>

              <div className="flex items-center justify-between rounded-md bg-muted/50 dark:bg-muted-foreground/10 p-1 px-3">
                <span
                  className={clsx("text-sm text-muted-foreground", textCls)}
                >
                  Total fixed
                </span>
                <span className="text-base font-semibold">
                  {formatINR(totalFixed)}
                </span>
              </div>
            </AccordionItem>

            {/* Section 2 */}
            <AccordionItem value="earnings" className="pb-2">
              <AccordionTrigger
                className={clsx(
                  "py-2 text-base font-semibold text-primary",
                  textCls
                )}
              >
                Earnings
              </AccordionTrigger>

              <AccordionContent className="p-2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="">
                    <div className={clsx("text-base font-medium", textCls)}>
                      Net Amount
                    </div>
                    <div
                      className={clsx("text-xs text-muted-foreground", textCls)}
                    >
                      Earnings - (Fixed + Business + Daily Spends)
                    </div>
                  </div>
                  <div className="text-base font-semibold">
                    {formatINR(netForDay)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size={"sm"}
                    variant="outline"
                    onClick={() =>
                      earningsFA.append({ label: "", amount: 0, tag: "" })
                    }
                    className="w-full"
                  >
                    Add earning
                  </Button>
                </div>

                <div className="space-y-3">
                  {earningsFA.fields.map((f, idx) => (
                    <LineItemRow
                      key={f.id}
                      control={form.control}
                      namePrefix={`earnings.${idx}`}
                      onRemove={() => earningsFA.remove(idx)}
                    />
                  ))}
                </div>
              </AccordionContent>

              <div className="flex items-center justify-between rounded-md bg-green-100 text-green-900 p-2">
                <span
                  className={clsx("text-sm text-muted-foreground", textCls)}
                >
                  Total earnings
                </span>
                <span className="text-base font-semibold">
                  {formatINR(totalEarnings)}
                </span>
              </div>
            </AccordionItem>

            {/* Section 3 */}
            <AccordionItem value="businessExpenses" className="pb-2">
              <AccordionTrigger
                className={clsx(
                  "py-2 text-base font-semibold text-primary",
                  textCls
                )}
              >
                Business Expense
              </AccordionTrigger>

              <AccordionContent className="p-2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size={"sm"}
                    variant="outline"
                    onClick={() =>
                      businessFA.append({ label: "", amount: 0, tag: "" })
                    }
                    className="w-full"
                  >
                    Add expense
                  </Button>
                </div>

                <div className="">
                  {businessFA.fields.map((f, idx) => (
                    <LineItemRow
                      key={f.id}
                      control={form.control}
                      namePrefix={`businessExpenses.${idx}`}
                      onRemove={() => businessFA.remove(idx)}
                    />
                  ))}
                </div>
              </AccordionContent>

              <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                <span
                  className={clsx("text-sm text-muted-foreground", textCls)}
                >
                  Total business expense
                </span>
                <span className="text-base font-semibold">
                  {formatINR(totalBusiness)}
                </span>
              </div>
            </AccordionItem>

            {/* Section 4 */}
            <AccordionItem value="dailySpends" className="pb-2">
              <AccordionTrigger
                className={clsx(
                  "py-2 text-primary font-semibold text-base",
                  textCls
                )}
              >
                Daily Spends
              </AccordionTrigger>

              <AccordionContent className="p-2">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size={"sm"}
                    variant="outline"
                    onClick={() =>
                      spendsFA.append({ label: "", amount: 0, tag: "" })
                    }
                    className="w-full"
                  >
                    Add spend
                  </Button>
                </div>

                <div className="space-y-3">
                  {spendsFA.fields.map((f, idx) => (
                    <LineItemRow
                      key={f.id}
                      control={form.control}
                      namePrefix={`dailySpends.${idx}`}
                      onRemove={() => spendsFA.remove(idx)}
                    />
                  ))}
                </div>
              </AccordionContent>

              <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                <span
                  className={clsx("text-sm text-muted-foreground", textCls)}
                >
                  Total daily spends
                </span>
                <span className="text-base font-semibold">
                  {formatINR(totalSpends)}
                </span>
              </div>
            </AccordionItem>
          </Accordion>

          {/* Final input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalCashCollected"
              render={({ field }) => (
                <div className="flex flex-col">
                  <FormItem className="flex">
                    <FormLabel
                      className={clsx("text-base text-center w-full", textCls)}
                    >
                      Total Cash Collected :
                    </FormLabel>
                    <FormControl>
                      <InputGroup className="w-1/2 focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                        <InputGroupAddon>₹</InputGroupAddon>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          {...field}
                          className={clsx(
                            "h-full text-lg text-center w-full border-0 shadow-none",
                            "focus-visible:ring-0 focus-visible:ring-offset-0"
                          )}
                          value={
                            field.value === 0
                              ? ""
                              : formatINR(Number(field.value), false, false)
                          }
                          onChange={(e) =>
                            field.onChange(parseINR(e.target.value))
                          }
                        />
                        <InputGroupAddon align="inline-end">/-</InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                  </FormItem>
                  <FormMessage className="text-xs" />
                </div>
              )}
            />

            <Button type="submit" className="md:justify-self-end">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
