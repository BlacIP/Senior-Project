"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CartItem,
  formatCurrency,
  GUEST_CART_OWNER,
  getCartOwnerKey,
  getCartItems,
  getCartTotal,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart";
import { getProductDetailPath } from "@/lib/slug";

export function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOwnerKey, setCartOwnerKey] = useState(GUEST_CART_OWNER);
  const [isResolvingCart, setIsResolvingCart] = useState(true);

  function refreshItems(ownerKey = cartOwnerKey) {
    setItems(getCartItems(ownerKey));
  }

  useEffect(() => {
    async function loadCartOwner() {
      const response = await fetch("/api/auth/me");
      let nextOwnerKey = GUEST_CART_OWNER;

      if (response.ok) {
        const body = (await response.json()) as {
          data?: { user?: { id: string; email: string } };
        };
        nextOwnerKey = getCartOwnerKey(body.data?.user);
      }

      setCartOwnerKey(nextOwnerKey);
      setItems(getCartItems(nextOwnerKey));
      setIsResolvingCart(false);
    }

    loadCartOwner();
  }, []);

  function updateQuantity(productId: string, quantity: number) {
    updateCartItemQuantity(cartOwnerKey, productId, quantity);
    refreshItems();
  }

  function removeItem(productId: string) {
    removeCartItem(cartOwnerKey, productId);
    refreshItems();
  }

  const total = getCartTotal(items);

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Cart</h1>
            <p className="text-muted-foreground">{items.length} products selected</p>
          </div>
          <Link href="/marketplace" className={buttonVariants({ variant: "outline" })}>
            Marketplace
          </Link>
        </header>

        {isResolvingCart ? (
          <CartSkeleton />
        ) : items.length ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <Card key={item.productId} className="py-0">
                  <CardContent className="grid gap-4 p-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={getProductDetailPath({
                          id: item.productId,
                          name: item.name,
                          vendorBusinessName: item.vendorBusinessName,
                        })}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.city} · {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Decrease ${item.name}`}
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus aria-hidden="true" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Increase ${item.name}`}
                        disabled={item.quantity >= item.stockQuantity}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Cart total</CardTitle>
                <CardDescription>Items are saved on this device.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </CardContent>
              <CardFooter>
                <Link href="/marketplace" className={buttonVariants({ className: "w-full" })}>
                  Continue browsing
                </Link>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
              <CardDescription>Add products from the marketplace to build a cart.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </main>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="py-0">
            <CardContent className="grid gap-4 p-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-8" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="size-8" />
                <Skeleton className="size-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-6 w-20" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-8 w-full" />
        </CardFooter>
      </Card>
    </div>
  );
}
