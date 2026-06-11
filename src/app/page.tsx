import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, LeafIcon, StoreIcon, TruckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser, logoutUser } from "@/server/auth-service";

const features = [
  {
    title: "Vendor onboarding",
    description: "Farmers and makers can create an account and prepare a storefront.",
    icon: StoreIcon,
  },
  {
    title: "Product listings",
    description: "Products include price, category, stock, city, and image placeholders.",
    icon: LeafIcon,
  },
  {
    title: "Order foundation",
    description: "The database is ready for carts, checkout, and order status updates.",
    icon: TruckIcon,
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const currentUser = await getCurrentUser();

  async function logout() {
    "use server";

    await logoutUser();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold">
            LocalLink
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/marketplace"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Browse
            </Link>
            {currentUser ? (
              <form action={logout}>
                <Button type="submit" size="sm">
                  Logout
                </Button>
              </form>
            ) : (
              <Link href="/login" className={buttonVariants({ size: "sm" })}>
                Login
              </Link>
            )}
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit" variant="secondary">
              Sprint 1 foundation
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-6xl">
                Local products from nearby vendors, organized for online selling.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                LocalLink connects farmers, craftspeople, and other local vendors with
                customers who want fresh produce and locally made goods.
              </p>
            </div>
            {!currentUser ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={buttonVariants({ size: "lg" })}>
                  Create account
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
                <Link
                  href="/vendor"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Vendor dashboard
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/marketplace" className={buttonVariants({ size: "lg" })}>
                  Browse marketplace
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border bg-muted p-2">
                      <feature.icon />
                    </div>
                    <div className="flex flex-col gap-1">
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ready for Neon DB once credentials are added to `.env.local`.
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
