export function slugifyProductName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProductDetailPath(product: {
  id: string;
  name: string;
  vendor?: { businessName: string | null } | null;
  vendorBusinessName?: string | null;
}) {
  const vendorName = product.vendor?.businessName ?? product.vendorBusinessName ?? "vendor";
  return `/marketplace/products/${slugifyProductName(vendorName)}/${slugifyProductName(
    product.name
  )}-${product.id.slice(0, 8)}`;
}

export function getShortIdFromProductSlug(slug: string) {
  const match = slug.match(/-([0-9a-f]{8})$/i);
  return match?.[1] ?? null;
}
