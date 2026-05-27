"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  city: string;
  stockQuantity: number;
};

export function MarketplaceClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const response = await fetch("/api/products");
      const body = (await response.json()) as {
        data?: { products?: Product[] };
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "Could not load products.");
      } else {
        setProducts(body.data?.products ?? []);
      }

      setIsLoading(false);
    }

    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Marketplace</h1>
            <p className="text-muted-foreground">Browse fresh local products and handmade goods.</p>
          </div>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Home
          </Link>
        </header>

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading products</CardTitle>
              <CardDescription>Fetching listings from the API.</CardDescription>
            </CardHeader>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Products unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : products.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>
                    {product.category} in {product.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold">${product.price}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.stockQuantity} in stock
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No products yet</CardTitle>
              <CardDescription>
                Vendor listings will appear here after Sprint 1 database setup is connected.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </main>
  );
}
