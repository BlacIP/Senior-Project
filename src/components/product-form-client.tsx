"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProductFormClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function createProduct(formData: FormData) {
    setError(null);
    setIsPending(true);

    const response = await fetch("/api/vendor/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const body = (await response.json()) as { error?: string };

    setIsPending(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError(body.error ?? "Could not create product.");
      return;
    }

    router.push("/vendor");
    router.refresh();
  }

  return (
    <Card>
      <form action={createProduct}>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
          <CardDescription>Create the first version of a vendor product listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Field>
              <FieldLabel htmlFor="name">Product name</FieldLabel>
              <Input id="name" name="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" name="description" rows={5} required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <Input id="price" name="price" type="number" min="0" step="0.01" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="stockQuantity">Stock</FieldLabel>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue="1"
                  required
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Input id="category" name="category" placeholder="Fresh produce" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" name="city" required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="imageUrl">Image URL</FieldLabel>
              <Input id="imageUrl" name="imageUrl" type="url" />
              <FieldDescription>
                Placeholder support until image uploads are added in a later sprint.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <Link href="/vendor" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create product"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
