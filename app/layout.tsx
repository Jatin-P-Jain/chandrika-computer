import {
  Amita,
  Baloo_2,
  Halant,
  Inter,
  Laila,
  Poppins,
} from "next/font/google";
import "./globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/custom/sections/navbar";
import { LanguageFontWrapper } from "@/components/custom/wrappers/language-font-wrapper";
import { AuthProvider } from "@/context/useAuth";
import { Toaster } from "sonner";
import { DateTimeDisplay } from "@/components/custom/date-time-display";
import { KeyboardProvider } from "@/context/keyboard-context";
import { NavigationLockProvider } from "@/context/navigation-lock-provider";
import { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { ServiceWorkerRegister } from "./service-worker-register";

const amita = Amita({
  variable: "--font-amita",
  weight: ["400", "700"],
  subsets: ["latin", "devanagari"],
});

const laila = Laila({
  variable: "--font-laila",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "devanagari"],
});
const baloo = Baloo_2({
  variable: "--font-baloo",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "devanagari"],
});
const inter = Inter({
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
const halant = Halant({
  variable: "--font-halant",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chandrika Computer",
  description: "",
  applicationName: "Chandrika Computer",
  themeColor: "#065884",
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${halant.variable} ${inter.variable} ${baloo.variable} ${poppins.variable} ${laila.variable} ${amita.variable} antialiased no-scrollbar bg-muted/60`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <LanguageFontWrapper>
              <NavigationLockProvider>
                <KeyboardProvider>
                  <AuthProvider>
                    <ServiceWorkerRegister />
                    <NextTopLoader
                      color="#065884"
                      height={3}
                      showSpinner={false}
                    />
                    <Navbar />
                    <DateTimeDisplay />
                    <main className="flex ">
                      <div className="w-full overflow-auto no-scrollbar! mx-auto md:mt-26 mt-22 p-2.5 max-w-6xl">
                        {children}
                      </div>
                    </main>
                    {/* <AccountFooter /> */}
                    <Toaster
                      closeButton
                      richColors
                      position="top-center"
                      // offset="calc(env(safe-area-inset-top) + 100px)"
                      mobileOffset="calc(env(safe-area-inset-top) + 85px)"
                      className="flex justify-center"
                      toastOptions={{
                        classNames: {
                          toast:
                            "w-[min(100vw,300px)]! min-h-14! flex items-start gap-2 px-4! py-3!",
                          title:
                            "font-semibold leading-snug",
                          description:
                            "text-sm leading-snug text-muted-foreground",
                        },
                      }}
                    />
                  </AuthProvider>
                </KeyboardProvider>
              </NavigationLockProvider>
            </LanguageFontWrapper>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
