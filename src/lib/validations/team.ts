import { z } from "zod";

export const TEAM_INVITE_ROLES = ["Manager", "Member"] as const;

export const teamInviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(TEAM_INVITE_ROLES, { message: "Select a valid role." }),
});

export const teamMemberIdSchema = z.object({
  id: z.string().uuid("Invalid team member ID."),
});

export const teamMemberRoleSchema = teamMemberIdSchema.extend({
  role: z.enum(TEAM_INVITE_ROLES, { message: "Select a valid role." }),
});

export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
export type TeamMemberIdInput = z.infer<typeof teamMemberIdSchema>;
export type TeamMemberRoleInput = z.infer<typeof teamMemberRoleSchema>;
