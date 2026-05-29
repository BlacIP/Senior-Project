import { z } from "zod";

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
  businessName: z.string().min(2),
  bio: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  category: z.string().min(2),
  city: z.string().min(2),
  stockQuantity: z.coerce.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const adminLoginSchema = loginSchema;
