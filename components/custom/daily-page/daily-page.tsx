"use client";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DailyFormValues, dailySchema } from "@/schema/dailay-page.schema";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-md border p-3">
      <FormField
        control={control}
        name={`${namePrefix}.label`}
        render={({ field }) => (
          <FormItem className="md:col-span-5">
            <FormLabel>Label</FormLabel>
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
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                {...field}
              />
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
            <FormLabel>
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

  // Static derived row example (you can rename/replace formula)
  const netForDay = totalEarnings - (totalFixed + totalBusiness + totalSpends);

  const onSubmit = (values: DailyFormValues) => {
    // Replace with API/Firebase call
    console.log("Daily form submit:", values);
  };

  return (
    <Card className="w-full p-6 py-3 shadow-sm border rounded-md dark:bg-slate-800 gap-2 overflow-auto">
      <div className="w-full text-center text-shadow-xs text-lg font-semibold font-script flex flex-col">
        <span className="text-base text-yellow-700">ॐ</span>
        <span className="text-orange-600"> श्री गणेशाय नमः</span>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Accordion type="multiple" className="w-full max-h-[40vh] overflow-auto no-scrollbar">
            {/* Section 1 */}
            <AccordionItem value="fixed">
              <AccordionTrigger className="font-semibold">Fixed Expenses / Charges</AccordionTrigger>
              <AccordionContent className="space-y-4 px-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fixed.sd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stamp Duty (SD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fixed.sc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sur Charge (SC)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fixed.fs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photocopy (FS)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between rounded-md bg-muted/50 dark:bg-muted-foreground/10 p-3">
                  <span className="text-sm text-muted-foreground">
                    Total fixed
                  </span>
                  <span className="text-sm font-semibold">{totalFixed}</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2 */}
            <AccordionItem value="earnings">
              <AccordionTrigger>Earnings</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {/* Static derived row */}
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      Net for day (derived)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Earnings - (Fixed + Business + Daily Spends)
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{netForDay}</div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Earning entries</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      earningsFA.append({ label: "", amount: 0, tag: "" })
                    }
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

                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">
                    Total earnings
                  </span>
                  <span className="text-sm font-semibold">{totalEarnings}</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3 */}
            <AccordionItem value="businessExpenses">
              <AccordionTrigger>Business Expense</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Expense entries</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      businessFA.append({ label: "", amount: 0, tag: "" })
                    }
                  >
                    Add expense
                  </Button>
                </div>

                <div className="space-y-3">
                  {businessFA.fields.map((f, idx) => (
                    <LineItemRow
                      key={f.id}
                      control={form.control}
                      namePrefix={`businessExpenses.${idx}`}
                      onRemove={() => businessFA.remove(idx)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">
                    Total business expense
                  </span>
                  <span className="text-sm font-semibold">{totalBusiness}</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4 */}
            <AccordionItem value="dailySpends">
              <AccordionTrigger>Daily Spends</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Spend entries</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      spendsFA.append({ label: "", amount: 0, tag: "" })
                    }
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

                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">
                    Total daily spends
                  </span>
                  <span className="text-sm font-semibold">{totalSpends}</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Final input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <FormField
              control={form.control}
              name="totalCashCollected"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cash Collected</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
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
