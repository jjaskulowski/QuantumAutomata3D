import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen bg-background">
      <div className="p-2 pt-4">
        <Skeleton className="hidden h-full w-[15rem] md:block" />
      </div>
      <div className="flex-1 p-2">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}
