"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

type AuthFormProps = {
  mode: "login" | "register";
  registered?: boolean;
  admin?: boolean;
};

export function AuthForm({
  mode,
  registered = false,
  admin = false,
}: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    registered ? "Account created. You can now log in." : null
  );
  const [isPending, setIsPending] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setIsPending(true);

    const payload = Object.fromEntries(formData);
    const response = await fetch(admin ? "/api/admin/login" : `/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as {
      data?: {
        user?: { role: "customer" | "vendor" | "admin"; email?: string };
      };
      error?: string;
    };

    setIsPending(false);

    if (!response.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }

    if (isRegister) {
      router.push("/login?registered=1");
    } else if (admin) {
      router.push("/admin");
    } else if (body.data?.user?.role === "admin") {
      router.push("/admin");
    } else {
      router.push(body.data?.user?.role === "vendor" ? "/vendor" : "/marketplace");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {admin ? "Admin login" : isRegister ? "Create your LocalLink account" : "Login"}
        </CardTitle>
        <CardDescription>
          {admin
            ? "Use a seeded admin account to manage the marketplace."
            : isRegister
              ? "Choose customer for shopping or vendor for selling local products."
              : "Access your customer or vendor workspace."}
        </CardDescription>
      </CardHeader>
      <form action={onSubmit}>
        <CardContent>
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{isRegister ? "Registration failed" : "Login failed"}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {message ? (
              <Alert>
                <AlertTitle>{isRegister ? "Account ready" : "Ready to log in"}</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
            {isRegister ? (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="name" autoComplete="name" required />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
              />
              {isRegister ? (
                <FieldDescription>Use at least 8 characters.</FieldDescription>
              ) : null}
            </Field>
            {isRegister ? (
              <Field>
                <FieldLabel htmlFor="role">Account type</FieldLabel>
                <select
                  id="role"
                  name="role"
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  defaultValue="customer"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Please wait..." : isRegister ? "Create account" : "Login"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            {admin ? (
              <Link className="font-medium text-foreground underline" href="/login">
                User login
              </Link>
            ) : (
              <Link
                className="font-medium text-foreground underline"
                href={isRegister ? "/login" : "/register"}
              >
                {isRegister ? "Login" : "Register"}
              </Link>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
