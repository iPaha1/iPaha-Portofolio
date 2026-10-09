// apps/api/app/lib/email-templates/components/brand.ts

// Brand constants — mirrors packages/ui design tokens. Email clients can't
// read CSS variables reliably, so these are duplicated as plain values here
// on purpose rather than imported.
export const brand = {
  bg: "#FFFFFF",
  bgAlt: "#F9F9F9",
  text: "#0A0A0A",
  textSecondary: "#555555",
  accent: "#FFB000",
  accentDark: "#E09D00",
  border: "#E5E5E5",
  fontHeading:
    "'Syne', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontBody:
    "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};