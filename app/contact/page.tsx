// =============================================================================
// isaacpaha.com — /contact page
// app/contact/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { ContactClient } from "./_contact/contact-client";


export const metadata: Metadata = {
  title: "Contact | Isaac Paha",
  description:
    "Get in touch with Isaac Paha — for collaboration, consulting, speaking, or just saying hi. Based in London, building across the UK and Ghana.",
  openGraph: {
    title: "Contact Isaac Paha",
    description:
      "Get in touch — for collaboration, consulting, speaking engagements, or just a conversation.",
    url: "https://www.isaacpaha.com/contact",
    type: "website",
  },
  twitter: {
    title: "Contact | Isaac Paha",
    description:
      "Get in touch with Isaac Paha — collaboration, consulting, speaking, or just saying hi.",
    card: "summary",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/contact",
  },
  keywords: [
    "Isaac Paha contact",
    "Isaac Paha email",
    "hire Isaac Paha",
    "Isaac Paha consulting",
    "Isaac Paha speaking",
  ],
};

export default function ContactPage() {
  return <ContactClient />;
}