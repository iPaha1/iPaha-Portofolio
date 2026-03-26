// =============================================================================
// isaacpaha.com — Custom QR Code Generator — Dedicated Tool Page
// app/tools/qr-code-generator/page.tsx
// Route: /tools/qr-code-generator
// =============================================================================

import type { Metadata }     from "next";
import { currentUser }       from "@clerk/nextjs/server";
import { QRGeneratorPage } from "./_qr-code-generator/qr-generator-page";


// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Custom QR Code Generator — Free Branded QR Codes",
  description:
    "Create beautiful, branded QR codes for free. Customise colours, dot shapes, gradients, and logos. Generate QR codes for URLs, LinkedIn, vCard, WiFi, payments, email, and more. Download as PNG or SVG.",
  openGraph: {
    title:       "Custom QR Code Generator | Free Tool — Isaac Paha",
    description: "Beautiful branded QR codes in seconds. 10 types, full design control, AI suggestions, PNG + SVG export.",
    url:         "https://isaacpaha.com/tools/qr-code-generator",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/qr-generator.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Custom QR Code Generator | Free Tool",
    description: "Beautiful branded QR codes. 10 types, full design control, free PNG + SVG download.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/qr-code-generator" },
  keywords: [
    "qr code generator", "custom qr code", "branded qr code", "free qr code",
    "qr code design", "qr code with logo", "linkedin qr code", "vcard qr code",
    "wifi qr code", "qr code download svg", "qr code generator free",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function QRCodeGeneratorPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <QRGeneratorPage isSignedIn={!!clerkUser} />;
}

