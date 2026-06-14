"use client";

import { CheckCircle2, MapPin, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/cart";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

type CustomerOrder = {
  id: string;
  status: OrderStatus;
  totalAmount: string;
  deliveryAddress: string | null;
  deliveryLatitude: string | null;
  deliveryLongitude: string | null;
  paymentProvider: string | null;
  paymentStatus: string;
  paymentReference: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
    } | null;
    vendor: {
      businessName: string;
      city: string;
      state: string;
    } | null;
  }>;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
};

const deliverySteps: OrderStatus[] = ["confirmed", "shipped", "delivered", "completed"];

function getStatusVariant(status: OrderStatus) {
  if (status === "cancelled") return "destructive";
  if (status === "delivered" || status === "completed") return "default";
  return "secondary";
}

export function ProfileClient() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const [userResponse, ordersResponse] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/orders"),
      ]);
      const userBody = (await userResponse.json()) as {
        data?: { user: CurrentUser };
        error?: string;
      };
      const ordersBody = (await ordersResponse.json()) as {
        data?: { orders: CustomerOrder[] };
        error?: string;
      };

      if (userResponse.status === 401 || ordersResponse.status === 401) {
        router.push("/login");
        return;
      }

      if (!userResponse.ok || !ordersResponse.ok) {
        setError(userBody.error ?? ordersBody.error ?? "Could not load profile.");
      } else {
        setUser(userBody.data?.user ?? null);
        setOrders(ordersBody.data?.orders ?? []);
        setError(null);
      }

      setIsLoading(false);
    }

    loadProfile();
  }, [router]);

  async function confirmReceived(orderId: string) {
    setConfirmingOrderId(orderId);
    setError(null);

    const response = await fetch(`/api/orders/${orderId}`, { method: "PATCH" });
    const body = (await response.json()) as { error?: string };

    setConfirmingOrderId(null);

    if (!response.ok) {
      setError(body.error ?? "Could not confirm order.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: "completed" } : order
      )
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Profile</h1>
            <p className="text-muted-foreground">
              {user ? `${user.name} · ${user.email}` : "Account, payment history, and delivery tracking"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/cart" className={buttonVariants({ variant: "outline" })}>
              Cart
            </Link>
            {user?.role === "vendor" ? (
              <Link href="/vendor" className={buttonVariants({ variant: "outline" })}>
                Vendor dashboard
              </Link>
            ) : null}
            <Link href="/#products" className={buttonVariants()}>
              Products
            </Link>
          </div>
        </header>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Orders unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {isLoading ? (
          <OrdersSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            {user ? (
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription className="capitalize">{user.role} account</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Orders</p>
                    <p className="font-medium">{orders.length}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {orders.length ? (
              orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <PackageCheck aria-hidden="true" />
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleString()} · {formatCurrency(order.totalAmount)}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">Payment</p>
                      <p className="text-sm text-muted-foreground">
                        {order.paymentProvider === "paystack-demo"
                          ? "Paystack demo"
                          : order.paymentProvider ?? "Manual"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.paymentStatus} · {order.paymentReference ?? "No reference"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <MapPin aria-hidden="true" />
                        Delivery
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryAddress ?? "No delivery address"}
                      </p>
                      {order.deliveryLatitude && order.deliveryLongitude ? (
                        <p className="text-xs text-muted-foreground">
                          {Number(order.deliveryLatitude).toFixed(4)},{" "}
                          {Number(order.deliveryLongitude).toFixed(4)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {deliverySteps.map((step) => {
                      const active =
                        order.status === "completed" ||
                        (order.status === "delivered" && step !== "completed") ||
                        deliverySteps.indexOf(step) <= deliverySteps.indexOf(order.status);
                      return (
                        <div
                          key={step}
                          className={
                            active
                              ? "rounded-lg border border-primary bg-primary/5 p-3 text-sm capitalize"
                              : "rounded-lg border p-3 text-sm capitalize text-muted-foreground"
                          }
                        >
                          {step}
                        </div>
                      );
                    })}
                  </div>

                  {order.status === "delivered" ? (
                    <Button
                      type="button"
                      className="w-fit"
                      disabled={confirmingOrderId === order.id}
                      onClick={() => confirmReceived(order.id)}
                    >
                      <CheckCircle2 aria-hidden="true" />
                      {confirmingOrderId === order.id
                        ? "Confirming..."
                        : "Confirm received"}
                    </Button>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{item.product?.name ?? "Product"}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.vendor?.businessName ?? "Vendor"} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.unitPrice)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              ))
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No orders yet</CardTitle>
                  <CardDescription>Checkout from your cart to start tracking an order.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export function OrdersClient() {
  return <ProfileClient />;
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
