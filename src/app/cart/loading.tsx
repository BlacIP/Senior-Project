import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-8 w-28" />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="py-0">
                <CardContent className="grid gap-4 p-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                  <Skeleton className="aspect-square rounded-lg" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8" />
                    <Skeleton className="h-5 w-8" />
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit">
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
