import { redirect } from "next/navigation";

import { ProductDetailClient } from "@/components/product-detail-client";
import { getProductDetailPath } from "@/lib/slug";
import { getPublicProduct } from "@/server/vendor-service";

type ProductDetailRouteProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function ProductDetailRoute({ params }: ProductDetailRouteProps) {
  const { slug } = await params;
  const [vendorIdentifier, productIdentifier] =
    slug.length > 1 ? [slug[0], slug[1]] : [undefined, slug[0]];

  const product = await getPublicProduct(productIdentifier ?? "", vendorIdentifier);

  if (product && slug.length === 1) {
    redirect(getProductDetailPath(product));
  }

  return (
    <ProductDetailClient
      productId={productIdentifier ?? ""}
      initialProduct={
        product
          ? {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              category: product.category,
              city: product.city,
              imageUrl: product.imageUrl,
              stockQuantity: product.stockQuantity,
              vendor: product.vendor,
            }
          : undefined
      }
    />
  );
}
