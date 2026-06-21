/**
 * Canonical public app URL for auth redirects and email links.
 *
 * Prefer NEXT_PUBLIC_APP_URL in production (custom domain).
 * Falls back to Vercel-provided hostnames when deployed without it.
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(
    /^https?:\/\//,
    "",
  );
  if (productionHost) return `https://${productionHost}`;

  const deploymentHost = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
  if (deploymentHost) return `https://${deploymentHost}`;

  return "http://localhost:3000";
}
