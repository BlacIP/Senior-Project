import { ProductEditClient } from "@/components/product-edit-client";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <ProductEditClient productId={id} />
      </div>
    </main>
  );
}
