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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type VerifyEmailClientProps = {
  email: string;
};

export function VerifyEmailClient({ email }: VerifyEmailClientProps) {
  const router = useRouter();
  const [emailValue, setEmailValue] = useState(email);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    email ? `Enter the code sent to ${email}.` : "Enter your email and verification code."
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function verify(formData: FormData) {
    setError(null);
    setMessage(null);
    setIsVerifying(true);

    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const body = (await response.json()) as { error?: string };

    setIsVerifying(false);

    if (!response.ok) {
      setError(body.error ?? "Could not verify that code.");
      return;
    }

    router.push("/login?verified=1");
  }

  async function resend() {
    setError(null);
    setMessage(null);
    setIsResending(true);

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailValue }),
    });
    const body = (await response.json()) as { error?: string };

    setIsResending(false);

    if (!response.ok) {
      setError(body.error ?? "Could not send another code.");
      return;
    }

    setMessage("A new verification code was sent.");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          LocalLink requires email verification before login.
        </CardDescription>
      </CardHeader>
      <form action={verify}>
        <CardContent>
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Verification failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {message ? (
              <Alert>
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={emailValue}
                onChange={(event) => setEmailValue(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="otp">Verification code</FieldLabel>
              <Input
                id="otp"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" type="submit" disabled={isVerifying}>
            {isVerifying ? "Verifying..." : "Verify email"}
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="outline"
            disabled={isResending || !emailValue}
            onClick={resend}
          >
            {isResending ? "Sending..." : "Resend code"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link className="font-medium text-foreground underline" href="/login">
              Login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
