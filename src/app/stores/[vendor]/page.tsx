import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/cart";
import { getProductDetailPath } from "@/lib/slug";
import { getPublicVendorStore } from "@/server/vendor-service";

export default async function VendorStorePage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor } = await params;
  const store = await getPublicVendorStore(vendor);

  if (!store) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex max-w-3xl flex-col gap-3">
            <Badge className="w-fit" variant="secondary">
              Vendor storefront
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {store.vendor.businessName}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                <MapPin aria-hidden="true" />
                {store.vendor.city}, {store.vendor.state}
              </p>
            </div>
            <p className="text-muted-foreground">
              {store.vendor.bio ?? "Browse products from this LocalLink vendor."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/#products" className={buttonVariants({ variant: "outline" })}>
              Products
            </Link>
            <Link href="/cart" className={buttonVariants()}>
              Cart
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {store.products.map((product) => (
            <Card key={product.id} className="gap-0 py-0">
              <Link
                href={getProductDetailPath(product)}
                className="aspect-[4/3] w-full overflow-hidden bg-muted"
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                    No image added
                  </div>
                )}
              </Link>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  {product.category} · {product.city}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <span className="text-lg font-semibold">{formatCurrency(product.price)}</span>
                <span className="text-sm text-muted-foreground">
                  {product.stockQuantity} in stock
                </span>
              </CardContent>
              <CardFooter>
                <Link
                  href={getProductDetailPath(product)}
                  className={buttonVariants({ variant: "outline", className: "w-full" })}
                >
                  <ShoppingBag aria-hidden="true" />
                  View product
                </Link>
              </CardFooter>
            </Card>
          ))}
        </section>

        {!store.products.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No products available</CardTitle>
              <CardDescription>This vendor has not published products yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
