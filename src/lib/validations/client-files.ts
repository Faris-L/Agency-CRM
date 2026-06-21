import { z } from "zod";

export const CLIENT_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_CLIENT_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const clientFileUploadSchema = z.object({
  clientId: z.string().uuid("Invalid client ID."),
});

export const clientFileIdSchema = z.object({
  id: z.string().uuid("Invalid file ID."),
});

export type ClientFileUploadInput = z.infer<typeof clientFileUploadSchema>;
export type ClientFileIdInput = z.infer<typeof clientFileIdSchema>;
