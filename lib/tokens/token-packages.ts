// =============================================================================
// isaacpaha.com — Token Packages (shared constants)
// lib/tokens/token-packages.ts
//
// Safe to import from BOTH client components AND server-side API routes.
// No database, no Node.js-only modules — pure data.
// =============================================================================

export const TOKEN_PACKAGES = [
  {
    id:          "starter",
    label:       "Starter",
    tokens:      5_000,
    price:       500,   // $5.00 USD in cents
    priceEnvKey: "STRIPE_PRICE_STARTER",
    popular:     false,
    badge:       null,
    per1k:       "$1.00 / 1,000 🪙",
  },
  {
    id:          "explorer",
    label:       "Explorer",
    tokens:      12_000,
    price:       1000,  // $10.00
    priceEnvKey: "STRIPE_PRICE_EXPLORER",
    popular:     true,
    badge:       "Most Popular",
    per1k:       "$0.83 / 1,000 🪙",
  },
  {
    id:          "builder",
    label:       "Builder",
    tokens:      35_000,
    price:       2500,  // $25.00
    priceEnvKey: "STRIPE_PRICE_BUILDER",
    popular:     false,
    badge:       "Best Value",
    per1k:       "$0.71 / 1,000 🪙",
  },
  {
    id:          "power",
    label:       "Power",
    tokens:      80_000,
    price:       5000,  // $50.00
    priceEnvKey: "STRIPE_PRICE_POWER",
    popular:     false,
    badge:       null,
    per1k:       "$0.63 / 1,000 🪙",
  },
] as const;

export type TokenPackageId = typeof TOKEN_PACKAGES[number]["id"];
export type TokenPackage   = typeof TOKEN_PACKAGES[number];