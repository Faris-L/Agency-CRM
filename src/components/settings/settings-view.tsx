import { ProfileView } from "@/components/profile/profile-view";
import type { Profile } from "@/types";

type SettingsViewProps = {
  profile: Profile;
};

export function SettingsView({ profile }: SettingsViewProps) {
  return <ProfileView profile={profile} />;
}
