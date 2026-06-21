"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { updatePassword } from "@/actions/auth";
import { removeAvatar, updateProfileSettings, uploadAvatar } from "@/actions/settings";
import { FormField } from "@/components/auth/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";
import {
  profileSettingsSchema,
  type ProfileSettingsInput,
} from "@/lib/validations/settings";
import type { Profile } from "@/types";

type ProfileViewProps = {
  profile: Profile;
};

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileView({ profile }: ProfileViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  const profileForm = useForm<ProfileSettingsInput>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: { fullName: profile.full_name ?? "" },
  });

  const passwordForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onProfileSubmit(values: ProfileSettingsInput) {
    const result = await updateProfileSettings(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Profile updated.");
    router.refresh();
  }

  async function onPasswordSubmit(values: UpdatePasswordInput) {
    const result = await updatePassword(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Password updated.");
    passwordForm.reset();
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadAvatar(formData);
    setUploadingAvatar(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Avatar updated.");
    router.refresh();
    event.target.value = "";
  }

  async function handleRemoveAvatar() {
    setRemovingAvatar(true);
    const result = await removeAvatar();
    setRemovingAvatar(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Avatar removed.");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Manage your name, avatar, and account security."
      />

      <section className="glass-panel space-y-6 rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-semibold">Personal info</h2>
          <p className="text-sm text-muted-foreground">
            Update how your name appears across the workspace.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
            <AvatarFallback className="text-lg">
              {initials(profile.full_name, profile.email)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload avatar
            </Button>
            {profile.avatar_url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={removingAvatar}
                onClick={handleRemoveAvatar}
              >
                {removingAvatar ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <FormField id="email" label="Email">
            <Input id="email" value={profile.email} disabled />
          </FormField>

          <FormField
            id="fullName"
            label="Full name"
            error={profileForm.formState.errors.fullName?.message}
          >
            <Input
              id="fullName"
              aria-invalid={Boolean(profileForm.formState.errors.fullName)}
              {...profileForm.register("fullName")}
            />
          </FormField>

          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
            {profileForm.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        </form>
      </section>

      <Separator />

      <section className="glass-panel space-y-6 rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground">
            Choose a strong password to keep your account secure.
          </p>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <FormField
            id="password"
            label="New password"
            error={passwordForm.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordForm.formState.errors.password)}
              {...passwordForm.register("password")}
            />
          </FormField>

          <FormField
            id="confirmPassword"
            label="Confirm new password"
            error={passwordForm.formState.errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
              {...passwordForm.register("confirmPassword")}
            />
          </FormField>

          <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
