import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ActivityInput = {
  userId: string;
  workspaceId: string;
  action: string;
  entityType: string;
  entityId: string;
};

export async function logActivity(
  supabase: SupabaseClient<Database>,
  input: ActivityInput,
): Promise<void> {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: input.userId,
    workspace_id: input.workspaceId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
  });

  if (error) {
    console.error("Failed to log activity:", error.message);
  }
}
