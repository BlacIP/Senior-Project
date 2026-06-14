"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminDashboard = {
  admin: {
    email: string;
    name: string;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "customer" | "vendor" | "admin";
  }>;
  vendors: Array<{
    id: string;
    businessName: string;
    city: string;
    state: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    category: string;
    price: string;
    city: string;
  }>;
  orders: Array<{
    id: string;
    status: string;
    totalAmount: string;
    paymentStatus: string;
    paymentReference: string | null;
    deliveryAddress: string | null;
    createdAt: string;
  }>;
};

export function AdminDashboardClient() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function loadDashboard() {
    const response = await fetch("/api/admin/dashboard");
    const body = (await response.json()) as {
      data?: AdminDashboard;
      error?: string;
    };

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (!response.ok) {
      setError(body.error ?? "Could not load admin dashboard.");
      return;
    }

    setDashboard(body.data ?? null);
  }

  useEffect(() => {
    // The admin dashboard is intentionally loaded from the reusable backend API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Admin dashboard</h1>
            <p className="text-muted-foreground">
              {dashboard?.admin.email ?? "Marketplace operations"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/#products" className={buttonVariants({ variant: "outline" })}>
              Products
            </Link>
            <Button type="button" variant="ghost" onClick={logout} disabled={isLoggingOut}>
              {isLoggingOut ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </header>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>{dashboard?.users.length ?? 0}</CardTitle>
              <CardDescription>Users</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{dashboard?.vendors.length ?? 0}</CardTitle>
              <CardDescription>Vendors</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{dashboard?.products.length ?? 0}</CardTitle>
              <CardDescription>Products</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{dashboard?.orders.length ?? 0}</CardTitle>
              <CardDescription>Orders</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent users</CardTitle>
              <CardDescription>LocalLink profiles linked to Neon Auth users.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {dashboard?.users.map((user) => (
                <div key={user.id} className="flex justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <p className="text-sm capitalize text-muted-foreground">{user.role}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample products</CardTitle>
              <CardDescription>Seeded and vendor-created listings.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {dashboard?.products.map((product) => (
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
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Payment and delivery status across the marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {dashboard?.orders.map((order) => (
                <div key={order.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.status} · {order.paymentStatus}
                      </p>
                    </div>
                    <p className="font-semibold">${order.totalAmount}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {order.paymentReference ?? "No payment reference"} ·{" "}
                    {order.deliveryAddress ?? "No delivery address"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
