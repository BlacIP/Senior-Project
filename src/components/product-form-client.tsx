"use client";

import { ImagePlus, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type ProductFormValue = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  categoryId: string | null;
  city: string;
  stockQuantity: number;
  imageUrl: string | null;
  imageKey: string | null;
};

type ProductFormClientProps = {
  product?: ProductFormValue;
};

type ImageUploadResponse = {
  data?: {
    image?: {
      url: string;
      key: string;
    };
  };
  error?: string;
};

type Category = {
  id: string;
  name: string;
};

const isEditMode = (product?: ProductFormValue): product is ProductFormValue => Boolean(product);

export function ProductFormClient({ product }: ProductFormClientProps) {
  const router = useRouter();
  const editing = isEditMode(product);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.categoryId ?? "");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [imageKey, setImageKey] = useState(product?.imageKey ?? "");
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const response = await fetch("/api/categories");
      const body = (await response.json()) as {
        data?: { categories?: Category[] };
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "Could not load product categories.");
        setIsLoadingCategories(false);
        return;
      }

      const nextCategories = body.data?.categories ?? [];
      setCategories(nextCategories);

      if (!selectedCategoryId && product?.category) {
        const matchingCategory = nextCategories.find(
          (category) => category.name.toLowerCase() === product.category.toLowerCase()
        );
        setSelectedCategoryId(matchingCategory?.id ?? "");
      }

      setIsLoadingCategories(false);
    }

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadImage(file: File) {
    const imageData = new FormData();
    imageData.append("image", file);

    setIsUploading(true);
    const response = await fetch("/api/vendor/products/images", {
      method: "POST",
      body: imageData,
    });
    const body = (await response.json()) as ImageUploadResponse;
    setIsUploading(false);

    if (response.status === 401) {
      router.push("/login");
      return null;
    }

    if (!response.ok || !body.data?.image) {
      throw new Error(body.error ?? "Could not upload product image.");
    }

    setImageUrl(body.data.image.url);
    setImageKey(body.data.image.key);
    return body.data.image;
  }

  async function saveProduct(formData: FormData) {
    setError(null);
    setIsPending(true);

    try {
      const image = formData.get("image");
      let nextImageUrl = imageUrl;
      let nextImageKey = imageKey;

      if (image instanceof File && image.size > 0) {
        const uploaded = await uploadImage(image);
        if (!uploaded) return;
        nextImageUrl = uploaded.url;
        nextImageKey = uploaded.key;
      }

      const payload = {
        categoryId: selectedCategoryId,
        name: formData.get("name"),
        description: formData.get("description"),
        price: formData.get("price"),
        category:
          categories.find((category) => category.id === selectedCategoryId)?.name ??
          product?.category ??
          "",
        city: formData.get("city"),
        stockQuantity: formData.get("stockQuantity"),
        imageUrl: nextImageUrl,
        imageKey: nextImageKey,
      };

      const response = await fetch(
        editing ? `/api/vendor/products/${product.id}` : "/api/vendor/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const body = (await response.json()) as { error?: string };

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(body.error ?? `Could not ${editing ? "update" : "create"} product.`);
        return;
      }

      router.push("/vendor");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save product.");
    } finally {
      setIsPending(false);
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <form action={saveProduct}>
        <CardHeader>
          <CardTitle>{editing ? "Edit product" : "Add product"}</CardTitle>
          <CardDescription>
            {editing
              ? "Update this listing while keeping it scoped to your vendor account."
              : "Create a vendor product listing for the marketplace."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Field>
              <FieldLabel htmlFor="name">Product name</FieldLabel>
              <Input id="name" name="name" defaultValue={product?.name} maxLength={120} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={product?.description}
                maxLength={1000}
                required
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0.01"
                  max="999999.99"
                  step="0.01"
                  defaultValue={product?.price}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="stockQuantity">Stock</FieldLabel>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  max="999999"
                  defaultValue={product?.stockQuantity ?? 1}
                  required
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <select
                  id="category"
                  name="categoryId"
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  disabled={isLoadingCategories}
                  required
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                >
                  <option value="">
                    {isLoadingCategories ? "Loading categories..." : "Select a category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" name="city" defaultValue={product?.city} maxLength={80} required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="image">Product image</FieldLabel>
              <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-40 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <ImagePlus className="size-8" aria-hidden="true" />
                  </div>
                )}
                <Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
              </div>
              <FieldDescription>Upload a JPG, PNG, WebP, or GIF image up to 5MB.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <Link href="/vendor" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
          <Button type="submit" disabled={isPending || isUploading}>
            <Save aria-hidden="true" />
            {isUploading
              ? "Uploading..."
              : isPending
                ? editing
                  ? "Saving..."
                  : "Creating..."
                : editing
                  ? "Save product"
                  : "Create product"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
