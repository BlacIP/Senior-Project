import { AuthForm } from "@/components/auth-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <AuthForm mode="login" admin />
    </main>
  );
}
