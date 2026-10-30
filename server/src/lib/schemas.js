import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\+254\d{9}$/, 'Invalid Kenyan phone number');

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createOrderSchema = z.object({
  items: z.array(z.object({
    menuItem: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid item ID'),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(50),
  type: z.enum(['delivery', 'pickup']).default('delivery'),
  paymentMethod: z.literal('mpesa').default('mpesa'),
  address: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    notes: z.string().max(300).optional(),
  }).optional(),
});

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ID');
