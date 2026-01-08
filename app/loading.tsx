import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <Loader className="size-8 animate-spin text-primary" />
    </div>
  );
}
