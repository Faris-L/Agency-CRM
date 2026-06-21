"use server";

import { revalidatePath } from "next/cache";
import { getWorkspaceContext, requirePermission } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_AVATAR_TYPES,
  AVATAR_MAX_BYTES,
  profileSettingsSchema,
  type ProfileSettingsInput,
} from "@/lib/validations/settings";
import type { ActionResult, Profile } from "@/types";

const AVATARS_BUCKET = "avatars";

function validationError<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

function getAvatarExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function updateProfileSettings(
  input: ProfileSettingsInput,
): Promise<ActionResult<Profile>> {
  const parsed = profileSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageSettings");
  if (denied) return denied;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", ctx.userId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to update profile.");
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true, data };
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<Profile>> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return validationError("Please select an image to upload.");
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return validationError("Avatar must be 2 MB or smaller.");
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return validationError("Avatar must be a JPEG, PNG, WebP, or GIF image.");
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageSettings");
  if (denied) return denied;

  const supabase = await createClient();
  const extension = getAvatarExtension(file.type);
  const storagePath = `${ctx.userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return validationError(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq("id", ctx.userId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to save avatar.");
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true, data };
}

export async function removeAvatar(): Promise<ActionResult<Profile>> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return validationError("You must be signed in.");

  const denied = requirePermission(ctx, "manageSettings");
  if (denied) return denied;

  const supabase = await createClient();

  if (ctx.profile.avatar_url) {
    const marker = `/avatars/`;
    const index = ctx.profile.avatar_url.indexOf(marker);
    if (index !== -1) {
      const storagePath = ctx.profile.avatar_url.slice(index + marker.length);
      await supabase.storage.from(AVATARS_BUCKET).remove([storagePath]);
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", ctx.userId)
    .select()
    .single();

  if (error || !data) {
    return validationError(error?.message ?? "Failed to remove avatar.");
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true, data };
}
