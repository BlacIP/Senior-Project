"use client";

import { Loader2, PackageCheck, Pencil, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { getVendorStorePath } from "@/lib/slug";

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
  stockQuantity: number;
};

type Dashboard = {
  user: {
    email: string;
  };
  profile: VendorProfile | null;
  products: VendorProduct[];
};

type VendorOrder = {
  id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "completed" | "cancelled";
  totalAmount: string;
  deliveryAddress: string | null;
  paymentStatus: string;
  paymentReference: string | null;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    product: {
      name: string;
    } | null;
  }>;
};

export function VendorDashboardClient() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      loadOrders();
    }

    setIsLoading(false);
  }

  async function loadOrders() {
    const response = await fetch("/api/vendor/orders");
    const body = (await response.json()) as {
      data?: { orders: VendorOrder[] };
      error?: string;
    };

    if (response.ok) {
      setOrders(body.data?.orders ?? []);
    }
  }

  useEffect(() => {
    // The dashboard is intentionally loaded from the reusable backend API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile(formData: FormData, method: "POST" | "PUT") {
    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/vendor/profile", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const body = (await response.json()) as {
      data?: { profile?: VendorProfile };
      error?: string;
    };

    setIsSaving(false);

    if (!response.ok) {
      setError(body.error ?? "Could not save profile.");
      return;
    }

    if (method === "POST") {
      router.push("/vendor/products/new");
      return;
    }

    if (body.data?.profile) {
      setDashboard((current) =>
        current
          ? {
              ...current,
              profile: body.data?.profile ?? current.profile,
            }
          : current
      );
      setIsEditingProfile(false);
    }
  }

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function deleteProduct(productId: string) {
    const confirmed = window.confirm("Delete this product listing?");
    if (!confirmed) return;

    setDeletingProductId(productId);
    setError(null);

    const response = await fetch(`/api/vendor/products/${productId}`, {
      method: "DELETE",
    });
    const body = (await response.json()) as { error?: string };

    setDeletingProductId(null);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError(body.error ?? "Could not delete product.");
      return;
    }

    setDashboard((current) =>
      current
        ? {
            ...current,
            products: current.products.filter((product) => product.id !== productId),
          }
        : current
    );
  }

  async function updateOrderStatus(
    orderId: string,
    status: Exclude<VendorOrder["status"], "completed">
  ) {
    setUpdatingOrderId(orderId);
    setError(null);

    const response = await fetch(`/api/vendor/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = (await response.json()) as { error?: string };

    setUpdatingOrderId(null);

    if (!response.ok) {
      setError(body.error ?? "Could not update order status.");
      return;
    }

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
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
            <Link href="/#products" className={buttonVariants({ variant: "outline" })}>
              Products
            </Link>
            {dashboard?.profile ? (
              <Link
                href={getVendorStorePath(dashboard.profile.businessName)}
                className={buttonVariants({ variant: "outline" })}
              >
                Storefront
              </Link>
            ) : null}
            <Link href="/profile" className={buttonVariants({ variant: "outline" })}>
              Profile
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
              <CardTitle>Dashboard unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!dashboard?.profile ? (
          <Card>
            <form action={(formData) => saveProfile(formData, "POST")}>
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
              {isEditingProfile ? (
                <form action={(formData) => saveProfile(formData, "PUT")}>
                  <CardHeader>
                    <CardTitle>Edit vendor profile</CardTitle>
                    <CardDescription>Update your public business details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="editBusinessName">Business name</FieldLabel>
                        <Input
                          id="editBusinessName"
                          name="businessName"
                          defaultValue={dashboard.profile.businessName}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="editBio">Bio</FieldLabel>
                        <Textarea
                          id="editBio"
                          name="bio"
                          rows={4}
                          defaultValue={dashboard.profile.bio ?? ""}
                        />
                      </Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="editCity">City</FieldLabel>
                          <Input
                            id="editCity"
                            name="city"
                            defaultValue={dashboard.profile.city}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="editState">State</FieldLabel>
                          <Input
                            id="editState"
                            name="state"
                            defaultValue={dashboard.profile.state}
                            required
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                  </CardContent>
                  <CardFooter className="justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      <X aria-hidden="true" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      <Save aria-hidden="true" />
                      {isSaving ? "Saving..." : "Save profile"}
                    </Button>
                  </CardFooter>
                </form>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle>{dashboard.profile.businessName}</CardTitle>
                    <CardDescription>
                      {dashboard.profile.city}, {dashboard.profile.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {dashboard.profile.bio || "No vendor bio added yet."}
                  </CardContent>
                  <CardFooter className="justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Link href="/vendor/products/new" className={buttonVariants()}>
                        Add product
                      </Link>
                      <Link
                        href={getVendorStorePath(dashboard.profile.businessName)}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        View storefront
                      </Link>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Pencil aria-hidden="true" />
                      Edit profile
                    </Button>
                  </CardFooter>
                </>
              )}
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
                      className="flex flex-col justify-between gap-4 rounded-lg border p-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category} · {product.city} · {product.stockQuantity} in stock
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <p className="mr-2 font-semibold">${product.price}</p>
                        <Link
                          href={`/vendor/products/${product.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "icon" })}
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                        >
                          <Pencil aria-hidden="true" />
                        </Link>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          aria-label={`Delete ${product.name}`}
                          title="Delete product"
                          disabled={deletingProductId === product.id}
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
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

        {dashboard?.profile ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck aria-hidden="true" />
                Customer orders
              </CardTitle>
              <CardDescription>
                Orders that include products from {dashboard.profile.businessName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {orders.length ? (
                orders.map((order) => (
                  <div key={order.id} className="rounded-lg border p-3">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <Badge
                            variant={order.status === "cancelled" ? "destructive" : "secondary"}
                            className="capitalize"
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.customer?.name ?? "Customer"} ·{" "}
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.deliveryAddress ?? "No delivery address"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Payment {order.paymentStatus} · {order.paymentReference ?? "No reference"}
                        </p>
                      </div>
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          updateOrderStatus(
                            order.id,
                            event.target.value as Exclude<VendorOrder["status"], "completed">
                          )
                        }
                        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="completed" disabled>
                          Completed
                        </option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                        >
                          <span>
                            {item.product?.name ?? "Product"} x {item.quantity}
                          </span>
                          <span className="font-medium">${item.unitPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Customer orders will appear here after checkout.
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
