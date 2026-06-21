import { z } from "zod";

export const profileSettingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be at most 100 characters."),
});

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
