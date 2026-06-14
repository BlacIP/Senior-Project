"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function LogoutSubmitButton({ size = "default" }: { size?: "sm" | "default" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size={size} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {pending ? "Logging out..." : "Logout"}
    </Button>
  );
}
