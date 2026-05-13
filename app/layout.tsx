import { Baloo_2, Inter, Laila } from "next/font/google";
import "./globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/custom/sections/navbar";
import { LanguageFontWrapper } from "@/components/custom/wrappers/language-font-wrapper";
import { AuthProvider } from "@/context/useAuth";
import { KeyboardProvider } from "@/context/keyboard-context";
import { NavigationLockProvider } from "@/context/navigation-lock-provider";
import { Metadata, Viewport } from "next";
import { GlobalClientEnhancements } from "./global-client-enhancements";

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

export const metadata: Metadata = {
  title: "Chandrika Computer",
  description: "",
  applicationName: "Chandrika Computer",
  appleWebApp: {
    title: "Chandrika Computer",
  },
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#082f49",
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
        className={`${inter.variable} ${baloo.variable} ${laila.variable} antialiased no-scrollbar bg-muted/60`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <LanguageFontWrapper>
              <NavigationLockProvider>
                <KeyboardProvider>
                  <AuthProvider>
                    <GlobalClientEnhancements />
                    <Navbar />
                    <main className="flex ">
                      <div className="w-full overflow-auto no-scrollbar! mx-auto md:mt-26 mt-22 p-2.5 max-w-6xl">
                        {children}
                      </div>
                    </main>
                    {/* <AccountFooter /> */}
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
