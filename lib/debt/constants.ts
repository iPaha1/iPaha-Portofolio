// lib/debt/constants.ts

export const ALLOWED_EMAILS = [
  "pahaisaac@gmail.com",
  "ike4football@gmail.com",
] as const;

export type AllowedEmail = (typeof ALLOWED_EMAILS)[number];

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ALLOWED_EMAILS as readonly string[]).includes(email.toLowerCase());
}

export function getOtherParty(myEmail: string): string {
  return myEmail.toLowerCase() === "pahaisaac@gmail.com"
    ? "ike4football@gmail.com"
    : "pahaisaac@gmail.com";
}

export function getDisplayName(email: string): string {
  const map: Record<string, string> = {
    "pahaisaac@gmail.com": "Isaac",
    "ike4football@gmail.com":   "Fokanta",
  };
  return map[email.toLowerCase()] ?? email;
}