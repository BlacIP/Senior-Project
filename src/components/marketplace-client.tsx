"use client";

import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addCartItem,
  CART_CHANGED_EVENT,
  formatCurrency,
  GUEST_CART_OWNER,
  getCartOwnerKey,
  getCartCount,
  getCartItems,
} from "@/lib/cart";
import { getProductDetailPath } from "@/lib/slug";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  categoryId: string | null;
  city: string;
  imageUrl: string | null;
  stockQuantity: number;
  vendor: {
    businessName: string | null;
  } | null;
};

type Category = {
  id: string;
  name: string;
};

type CurrentUser = {
  id: string;
  email: string;
  role: "customer" | "vendor" | "admin";
};

export function MarketplaceClient({ embedded = false }: { embedded?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cartOwnerKey, setCartOwnerKey] = useState(GUEST_CART_OWNER);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isResolvingCartOwner, setIsResolvingCartOwner] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const productsResponse = await fetch("/api/products");
      const productsBody = (await productsResponse.json()) as {
        data?: { products?: Product[] };
        error?: string;
      };

      if (!productsResponse.ok) {
        setProductsError(productsBody.error ?? "Could not load products.");
      } else {
        setProducts(productsBody.data?.products ?? []);
      }

      setIsProductsLoading(false);
    }

    async function loadCategories() {
      const categoriesResponse = await fetch("/api/categories");
      const categoriesBody = (await categoriesResponse.json()) as {
        data?: { categories?: Category[] };
        error?: string;
      };

      if (!categoriesResponse.ok) {
        setCategoriesError(categoriesBody.error ?? "Could not load categories.");
      } else {
        setCategories(categoriesBody.data?.categories ?? []);
      }

      setIsCategoriesLoading(false);
    }

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
      setCurrentUser(body.data?.user ?? null);
      setCartOwnerKey(getCartOwnerKey(body.data?.user));
      setIsResolvingCartOwner(false);
    }

    loadProducts();
    loadCategories();
    loadCartOwner();
  }, []);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartCount(getCartItems(cartOwnerKey)));
    }

    syncCartCount();
    window.addEventListener(CART_CHANGED_EVENT, syncCartCount);
    return () => window.removeEventListener(CART_CHANGED_EVENT, syncCartCount);
  }, [cartOwnerKey]);

  const cities = useMemo(
    () => Array.from(new Set(products.map((product) => product.city))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return products.filter((product) => {
      const price = Number(product.price);
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery);
      const matchesCategory = !categoryId || product.categoryId === categoryId;
      const matchesCity = !city || product.city === city;
      const matchesMin = min === null || price >= min;
      const matchesMax = max === null || price <= max;

      return matchesQuery && matchesCategory && matchesCity && matchesMin && matchesMax;
    });
  }, [categoryId, city, maxPrice, minPrice, products, query]);

  function addProductToCart(product: Product) {
    addCartItem(cartOwnerKey, {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      city: product.city,
      vendorBusinessName: product.vendor?.businessName ?? null,
      stockQuantity: product.stockQuantity,
      quantity: 1,
    });
  }

  return (
    <section id="products" className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {embedded ? "Local products" : "Marketplace"}
            </h1>
            <p className="text-muted-foreground">Browse fresh local products and handmade goods.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/cart" className={buttonVariants({ variant: "outline" })}>
              <ShoppingCart aria-hidden="true" />
              Cart
              {cartCount ? <Badge variant="secondary">{cartCount}</Badge> : null}
            </Link>
            <Link href="/profile" className={buttonVariants({ variant: "outline" })}>
              Profile
            </Link>
            {currentUser?.role === "vendor" ? (
              <Link href="/vendor" className={buttonVariants({ variant: "outline" })}>
                Vendor dashboard
              </Link>
            ) : null}
          </div>
        </header>

        <Card>
          <CardContent className="grid gap-4 pt-0 md:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr]">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Search
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-8"
                  placeholder="Product name"
                />
              </div>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Category
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={isCategoriesLoading || Boolean(categoriesError)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">
                  {isCategoriesLoading ? "Loading categories..." : "All categories"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoriesError ? (
                <span className="text-xs font-normal text-muted-foreground">
                  Category filters unavailable.
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Location
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">All cities</option>
                {cities.map((nextCity) => (
                  <option key={nextCity} value={nextCity}>
                    {nextCity}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Min price
              <Input
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Max price
              <Input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </label>
          </CardContent>
        </Card>

        {productsError ? (
          <Card>
            <CardHeader>
              <CardTitle>Products unavailable</CardTitle>
              <CardDescription>{productsError}</CardDescription>
            </CardHeader>
          </Card>
        ) : isProductsLoading ? (
          <ProductCardSkeletonGrid />
        ) : filteredProducts.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
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
                    {product.category} in {product.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold">{formatCurrency(product.price)}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.stockQuantity} in stock
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="justify-between gap-2">
                  <Link
                    href={getProductDetailPath(product)}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Details
                  </Link>
                  <Button
                    type="button"
                    onClick={() => addProductToCart(product)}
                    disabled={isResolvingCartOwner || product.stockQuantity <= 0}
                  >
                    <ShoppingCart aria-hidden="true" />
                    Add
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No matching products</CardTitle>
              <CardDescription>Adjust the search or filters to see more listings.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </section>
  );
}

function ProductCardSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="gap-0 py-0">
          <Skeleton className="aspect-[4/3] w-full rounded-b-none" />
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
