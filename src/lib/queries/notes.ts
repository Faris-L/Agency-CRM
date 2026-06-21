import { createClient } from "@/lib/supabase/server";
import type { Note, Profile } from "@/types";

export type NoteWithAuthor = Note & {
  profiles: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export async function getNotesByClientId(clientId: string): Promise<NoteWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*, profiles(id, full_name, email)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch notes:", error.message);
    return [];
  }

  return (data ?? []) as NoteWithAuthor[];
}
