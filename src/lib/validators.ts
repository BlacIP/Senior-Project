import { z } from "zod";

const requiredText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["customer", "vendor"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const vendorProfileSchema = z.object({
  businessName: requiredText(2, 120),
  bio: z.string().trim().max(500).optional(),
  city: requiredText(2, 80),
  state: requiredText(2, 80),
});

export const productSchema = z.object({
  name: requiredText(2, 120),
  description: requiredText(10, 1000),
  price: z.coerce.number().positive().max(999999.99),
  category: requiredText(2, 80),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  city: requiredText(2, 80),
  stockQuantity: z.coerce.number().int().min(0).max(999999),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imageKey: z.string().trim().max(512).optional().or(z.literal("")),
});

export const productImageUploadSchema = z.object({
  fileName: requiredText(1, 180),
  contentType: z
    .string()
    .trim()
    .refine((value) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(value), {
      message: "Image must be a JPG, PNG, WebP, or GIF file.",
    }),
  size: z.number().int().positive().max(5 * 1024 * 1024, "Image must be 5MB or smaller."),
});

export const checkoutSchema = z.object({
  userIdentifier: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().min(1).max(999),
      })
    )
    .min(1),
  deliveryAddress: requiredText(5, 240),
  deliveryLatitude: z.coerce.number().min(-90).max(90).optional(),
  deliveryLongitude: z.coerce.number().min(-180).max(180).optional(),
  paymentProvider: z.literal("paystack-demo"),
  paymentReference: requiredText(8, 80),
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

export const adminLoginSchema = loginSchema;
