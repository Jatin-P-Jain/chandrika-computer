"use client";

import Link from "next/link";
import { ClipboardListIcon, Info, Layers, LogInIcon } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ServicesGate() {
  const tHomePage = useTranslations("HomePage");
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const tStampStockLedger = useTranslations("StampStock");
  return (
    <section className="flex w-full flex-col mx-auto space-y-6 rounded-xl bg-muted/60 p-6 shadow-sm">
      {/* Information block */}
      <Card className="border-0 bg-background shadow-none">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className=" rounded-full p-2  bg-primary/10 text-primary">
            <Info className="size-5" />
          </div>
          <div>
            <CardTitle className="">{tHomePage("SecureServices")}</CardTitle>
            <CardDescription>{tHomePage("SecureServicesDesc")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="">
          <Button asChild>
            <Link href="/login">
              {tCommon("Login")}
              <LogInIcon />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Service cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/daily-account" className="group block">
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex size-20 items-center justify-center rounded-md bg-indigo-100 text-indigo-900/90 ">
                {/* replace with your own icon */}
                <span className="">
                  <ClipboardListIcon className="size-12" />
                </span>
              </div>
              <div>
                <CardTitle className="">{tDailyAccount("Title")}</CardTitle>
                <CardDescription className="text-sm">
                  {tDailyAccount("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/stamp-stock-ledger" className="group block">
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex size-20 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                {/* replace with your own icon */}
                <span className=" font-semibold">
                  <Layers className="size-12" />
                </span>
              </div>
              <div>
                <CardTitle className="">{tStampStockLedger("Title")}</CardTitle>
                <CardDescription className="">
                  {tStampStockLedger("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </section>
  );
}
