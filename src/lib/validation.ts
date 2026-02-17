import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const sendCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["email_verify", "password_reset"]),
});

export const petSchema = z.object({
  name: z.string().min(1, "Name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  age: z.string().optional(),
  primaryPhotoUrl: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  medications: z.string().optional(),
  vaccinations: z.string().optional(),
  allergies: z.string().optional(),
  specialNeeds: z.string().optional(),
  foodIntolerances: z.string().optional(),
  behavioralNotes: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  ownerAddress: z.string().optional(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string(),
        phone: z.string(),
        relationship: z.string().optional(),
      })
    )
    .optional(),
  privacyEnabled: z.boolean().optional(),
});

export const activateTagSchema = z.object({
  activationCode: z.string().min(1, "Activation code is required"),
});

export const linkTagSchema = z.object({
  petId: z.string().min(1, "Profile ID is required"),
});

export const scanLogSchema = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const finderContactSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  message: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

export const b2bContactSchema = contactSchema.extend({
  website: z.string().optional(),
  address: z.string().optional(),
  currentProducts: z.string().optional(),
  neededProducts: z.string().optional(),
  salesMethods: z.string().optional(),
  targetArea: z.string().optional(),
  orderVolume: z.string().optional(),
  priority: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PetInput = z.infer<typeof petSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type B2BContactInput = z.infer<typeof b2bContactSchema>;
