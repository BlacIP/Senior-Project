import { ProductFormClient } from "@/components/product-form-client";

export default function NewProductPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <ProductFormClient />
      </div>
    </main>
  );
}
