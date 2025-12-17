import { ThemeModeToggle } from "@/components/custom/theme-mode-button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-en">
      <main className="flex min-h-screen w-full max-w-7xl flex-col items-center justify-between py-32 px-16">
        <Card>
          <div className="flex flex-col items-center p-8">
            <h1 className="mb-4 text-4xl font-semibold">
              Welcome to Our Application
            </h1>
            <p className="text-center">
              This is a sample application built with Next.js and Tailwind CSS.
              Explore the features and enjoy your experience!
            </p>
          </div>
          <ThemeModeToggle />
        </Card>
      </main>
    </div>
  );
}
