// lib/auth-redirect.ts
export function safeCallbackUrl(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) return fallback;
  // Must be a relative path on this site
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
