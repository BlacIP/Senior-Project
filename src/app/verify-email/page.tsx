import { VerifyEmailClient } from "@/components/verify-email-client";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <VerifyEmailClient email={params.email ?? ""} />
    </main>
  );
}
