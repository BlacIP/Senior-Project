"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductFormClient, type ProductFormValue } from "@/components/product-form-client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProductEditClient({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductFormValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      const response = await fetch(`/api/vendor/products/${productId}`);
      const body = (await response.json()) as {
        data?: { product?: ProductFormValue };
        error?: string;
      };

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok || !body.data?.product) {
        setError(body.error ?? "Could not load product.");
      } else {
        setProduct(body.data.product);
      }

      setIsLoading(false);
    }

    loadProduct();
  }, [productId, router]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading product</CardTitle>
          <CardDescription>Fetching the listing details.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product unavailable</CardTitle>
          <CardDescription>{error ?? "This product could not be found."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ProductFormClient product={product} />;
}
