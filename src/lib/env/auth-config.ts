/**
 * When true, new sign-ups are created as confirmed via the service role
 * (no Supabase confirmation email). Use for demo/portfolio without a custom email domain.
 */
export function isEmailConfirmationSkipped(): boolean {
  return process.env.AUTH_SKIP_EMAIL_CONFIRMATION === "true";
}
