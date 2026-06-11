"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { addCartItem, formatCurrency, GUEST_CART_OWNER, getCartOwnerKey } from "@/lib/cart";

type ProductDetail = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  city: string;
  imageUrl: string | null;
  stockQuantity: number;
  vendor: {
    businessName: string | null;
    bio: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

type CurrentUser = {
  id: string;
  email: string;
};

export function ProductDetailClient({
  productId,
  initialProduct,
}: {
  productId: string;
  initialProduct?: ProductDetail;
}) {
  const [product, setProduct] = useState<ProductDetail | null>(initialProduct ?? null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [cartOwnerKey, setCartOwnerKey] = useState(GUEST_CART_OWNER);
  const [isResolvingCartOwner, setIsResolvingCartOwner] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) return;

    async function loadProduct() {
      const response = await fetch(`/api/products/${productId}`);
      const body = (await response.json()) as {
        data?: { product?: ProductDetail };
        error?: string;
      };

      if (!response.ok || !body.data?.product) {
        setError(body.error ?? "Could not load product.");
      } else {
        setProduct(body.data.product);
      }

      setIsLoading(false);
    }

    loadProduct();
  }, [initialProduct, productId]);

  useEffect(() => {
    async function loadCartOwner() {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        setCartOwnerKey(GUEST_CART_OWNER);
        setIsResolvingCartOwner(false);
        return;
      }

      const body = (await response.json()) as {
        data?: { user?: CurrentUser };
      };
      setCartOwnerKey(getCartOwnerKey(body.data?.user));
      setIsResolvingCartOwner(false);
    }

    loadCartOwner();
  }, []);

  function setSafeQuantity(value: number) {
    if (!product) return;
    setQuantity(Math.min(Math.max(value, 1), product.stockQuantity));
  }

  function addProductToCart() {
    if (!product) return;

    addCartItem(cartOwnerKey, {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      city: product.city,
      vendorBusinessName: product.vendor?.businessName ?? null,
      stockQuantity: product.stockQuantity,
      quantity,
    });
    setCartMessage(`${quantity} added to cart`);
  }

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Product unavailable</CardTitle>
              <CardDescription>{error ?? "This product could not be found."}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/marketplace" className={buttonVariants({ variant: "outline" })}>
            Marketplace
          </Link>
          <Link href="/cart" className={buttonVariants({ variant: "outline" })}>
            <ShoppingCart aria-hidden="true" />
            Cart
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground">
                No image added
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge variant="outline">{product.city}</Badge>
                </div>
                <CardTitle className="text-3xl">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {product.stockQuantity} in stock
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setSafeQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus aria-hidden="true" />
                  </Button>
                  <Input
                    value={quantity}
                    onChange={(event) => setSafeQuantity(Number(event.target.value))}
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    className="w-20 text-center"
                    aria-label="Quantity"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setSafeQuantity(quantity + 1)}
                    disabled={quantity >= product.stockQuantity}
                    aria-label="Increase quantity"
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    onClick={addProductToCart}
                    disabled={isResolvingCartOwner || product.stockQuantity <= 0}
                  >
                    <ShoppingCart aria-hidden="true" />
                    Add to cart
                  </Button>
                </div>
                {cartMessage ? (
                  <p className="text-sm text-muted-foreground">{cartMessage}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{product.vendor?.businessName ?? "Vendor"}</CardTitle>
                <CardDescription>
                  {[product.vendor?.city, product.vendor?.state].filter(Boolean).join(", ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {product.vendor?.bio ?? "No vendor bio added yet."}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

export function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-9 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="size-8" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
