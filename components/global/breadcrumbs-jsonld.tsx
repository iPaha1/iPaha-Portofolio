// components/breadcrumb-jsonld.tsx
"use client";

import { useSelectedLayoutSegments } from "next/navigation";

const SITE_URL = "https://www.isaacpaha.com";

const segmentNames: Record<string, string> = {
  blog: "Blog",
  apps: "Apps",
  tools: "Tools",
  games: "Games",
  ideas: "Ideas Lab",
  now: "Now",
  about: "About",
  contact: "Contact",
  newsletter: "Newsletter",
  "ask-isaac": "Ask Isaac",
  podcast: "Podcast",
  technology: "Technology",
  business: "Business",
  society: "Society",
  life: "Life",
  education: "Education",
  "ideas-lab": "Ideas Lab",
  "token-rush": "Token Rush",
};

type BreadcrumbItem = {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
};

export function BreadcrumbJsonLd() {
  const segments = useSelectedLayoutSegments();
  
  // Filter out route groups
  const filteredSegments = segments.filter(
    (segment) => !segment.startsWith("(") && !segment.startsWith("[")
  );

  // Don't output on homepage
  if (filteredSegments.length === 0) return null;

  // Build breadcrumb items for schema
  const itemListElement: BreadcrumbItem[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    ...filteredSegments.map<BreadcrumbItem>((segment, index) => {
      const url = `${SITE_URL}/${filteredSegments.slice(0, index + 1).join("/")}`;
      const name =
        segmentNames[segment] ||
        segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return {
        "@type": "ListItem",
        position: index + 2,
        name,
        item: url,
      };
    }),
  ];

  // Mark the last item as current (no 'item' property for current page)[citation:10]
  if (itemListElement.length > 0) {
    delete itemListElement[itemListElement.length - 1].item;
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };

  // CRITICAL: Use plain <script> with dangerouslySetInnerHTML
  // This ensures the JSON-LD is in the initial server HTML
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"), // XSS prevention[citation:9]
      }}
    />
  );
}