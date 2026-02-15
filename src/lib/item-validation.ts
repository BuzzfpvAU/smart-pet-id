import { z } from "zod/v4";
import type { FieldGroupDefinition } from "./tag-types";

export function buildItemDataSchema(fieldGroups: FieldGroupDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const group of fieldGroups) {
    for (const field of group.fields) {
      if (field.type === "contacts_list") {
        const contactSchema = z.array(
          z.object({
            name: z.string(),
            phone: z.string(),
            relationship: z.string().optional(),
          })
        );
        shape[field.key] = field.required ? contactSchema : contactSchema.optional();
        continue;
      }

      if (field.type === "checklist_builder") {
        const checklistSchema = z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            type: z.enum(["checkbox", "number", "text"]),
            required: z.boolean(),
          })
        );
        shape[field.key] = field.required ? checklistSchema : checklistSchema.optional();
        continue;
      }

      let fieldSchema: z.ZodTypeAny;
      switch (field.type) {
        case "number":
          fieldSchema = z.union([z.number(), z.string()]);
          break;
        case "toggle":
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string();
          break;
      }

      shape[field.key] = field.required ? fieldSchema : fieldSchema.optional();
    }
  }

  return z.object(shape).passthrough();
}

export const createItemSchema = z.object({
  tagTypeSlug: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  data: z.record(z.string(), z.unknown()).optional().default({}),
  photoUrls: z.array(z.string()).optional().default([]),
  primaryPhotoUrl: z.string().optional().nullable(),
  ownerPhone: z.string().optional().nullable(),
  ownerEmail: z.string().optional().nullable(),
  ownerAddress: z.string().optional().nullable(),
  rewardOffered: z.boolean().optional().default(false),
  rewardDetails: z.string().optional().nullable(),
  visibility: z.record(z.string(), z.boolean()).optional().default({}),
});

export const updateItemSchema = createItemSchema.partial().omit({ tagTypeSlug: true });
