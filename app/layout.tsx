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
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",
    apple: "/icons/apple-touch-icon.png", // Added /icons/
    other: [{ rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png" }], // Added /icons/
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
                    <NextTopLoader
                      color="#065884"
                      height={3}
                      showSpinner={false}
                    />
                    <Navbar />
                    <DateTimeDisplay />
                    <main className="flex ">
                      <div className="w-full overflow-auto no-scrollbar! mx-auto md:mt-32 mt-28 p-4 max-w-7xl">
                        {children}
                      </div>
                    </main>
                    {/* <AccountFooter /> */}
                    <div className="flex md:hidden">
                      <Toaster
                        closeButton
                        richColors
                        position="bottom-center"
                        className="flex justify-center"
                        toastOptions={{
                          classNames: {
                            toast:
                              "md:w-fit! flex items-center p-2! px-4! md:p-4!",
                            title: "font-semibold w-full",
                            description: "",
                          },
                        }}
                      />
                    </div>
                    <div className="hidden md:flex">
                      <Toaster
                        closeButton
                        richColors
                        position="top-center"
                        className="flex justify-center"
                        toastOptions={{
                          classNames: {
                            toast: "w-fit! flex items-center gap-3",
                            title: "text-lg font-semibold w-full",
                            description: "md:text-base",
                          },
                        }}
                      />
                    </div>
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
