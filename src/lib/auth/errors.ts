export function getAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }

  if (normalized.includes("user already registered")) {
    return "An account with this email already exists.";
  }

  if (normalized.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }

  if (normalized.includes("signup is disabled")) {
    return "Sign up is currently disabled. Please contact support.";
  }

  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return message;
}
