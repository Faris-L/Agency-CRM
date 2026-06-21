import { createClient } from "@/lib/supabase/server";
import type { ClientFile, Profile } from "@/types";

export type ClientFileWithUploader = ClientFile & {
  profiles: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export async function getClientFilesByClientId(
  clientId: string,
): Promise<ClientFileWithUploader[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_files")
    .select("*, profiles(id, full_name, email)")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch client files:", error.message);
    return [];
  }

  return (data ?? []) as ClientFileWithUploader[];
}

export async function getClientFileById(id: string): Promise<ClientFile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("client_files").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("Failed to fetch client file:", error.message);
    return null;
  }

  return data;
}
