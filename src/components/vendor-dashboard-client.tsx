"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VendorProfile = {
  id: string;
  businessName: string;
  bio: string | null;
  city: string;
  state: string;
};

type VendorProduct = {
  id: string;
  name: string;
  price: string;
  category: string;
  city: string;
};

type Dashboard = {
  user: {
    email: string;
  };
  profile: VendorProfile | null;
  products: VendorProduct[];
};

export function VendorDashboardClient() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadDashboard() {
    const response = await fetch("/api/vendor/profile");
    const body = (await response.json()) as { data?: Dashboard; error?: string };

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError(body.error ?? "Could not load vendor dashboard.");
    } else {
      setDashboard(body.data ?? null);
      setError(null);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    // The dashboard is intentionally loaded from the reusable backend API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createProfile(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/vendor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const body = (await response.json()) as { error?: string };

    setIsSaving(false);

    if (!response.ok) {
      setError(body.error ?? "Could not save profile.");
      return;
    }

    router.push("/vendor/products/new");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading vendor dashboard</CardTitle>
              <CardDescription>Checking your session through the API.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Vendor dashboard</h1>
            <p className="text-muted-foreground">{dashboard?.user.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace" className={buttonVariants({ variant: "outline" })}>
              Marketplace
            </Link>
            <Button type="button" variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Dashboard unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!dashboard?.profile ? (
          <Card>
            <form action={createProfile}>
              <CardHeader>
                <CardTitle>Set up your vendor profile</CardTitle>
                <CardDescription>
                  Add the public business details customers will use to discover your products.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="businessName">Business name</FieldLabel>
                    <Input id="businessName" name="businessName" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="bio">Bio</FieldLabel>
                    <Textarea id="bio" name="bio" rows={4} />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="city">City</FieldLabel>
                      <Input id="city" name="city" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="state">State</FieldLabel>
                      <Input id="state" name="state" required />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save profile"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle>{dashboard.profile.businessName}</CardTitle>
                <CardDescription>
                  {dashboard.profile.city}, {dashboard.profile.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {dashboard.profile.bio || "No vendor bio added yet."}
              </CardContent>
              <CardFooter>
                <Link href="/vendor/products/new" className={buttonVariants()}>
                  Add product
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product listings</CardTitle>
                <CardDescription>
                  {dashboard.products.length} products connected to your vendor profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {dashboard.products.length ? (
                  dashboard.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category} · {product.city}
                        </p>
                      </div>
                      <p className="font-semibold">${product.price}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add your first product to complete the Sprint 1 listing foundation.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
