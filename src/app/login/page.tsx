import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/auth-service";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect("/marketplace");
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <AuthForm mode="login" registered={params.registered === "1"} />
    </main>
  );
}
