/**
 * When true, new sign-ups are created as confirmed via the service role
 * (no Supabase confirmation email). Use for demo/portfolio without a custom email domain.
 */
export function isEmailConfirmationSkipped(): boolean {
  return process.env.AUTH_SKIP_EMAIL_CONFIRMATION === "true";
}

/** Admin sign-up + immediate login when service role is available. */
export function canAutoConfirmSignup(): boolean {
  return isEmailConfirmationSkipped() || Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
