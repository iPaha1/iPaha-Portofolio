"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  name: string;
  url: string;
  isCurrent?: boolean;
}

// Mapping of URL segments to human-readable names
const segmentNames: Record<string, string> = {
  "blog": "Blog",
  "apps": "Apps",
  "tools": "Tools",
  "games": "Games",
  "ideas": "Ideas Lab",
  "now": "Now",
  "about": "About",
  "contact": "Contact",
  "newsletter": "Newsletter",
  "privacy": "Privacy",
  "terms": "Terms",
  "ask-isaac": "Ask Isaac",
  "podcast": "Podcast",
  
  // Blog categories
  "technology": "Technology",
  "business": "Business",
  "society": "Society",
  "life": "Life",
  "education": "Education",
  "ideas-lab": "Ideas Lab",
  
  // Dynamic patterns (handled separately)
  "token-rush": "Token Rush",
};

export function Breadcrumb() {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on homepage
  if (pathname === "/") return null;
  
  const segments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    ...segments.map((segment, index) => {
      const url = "/" + segments.slice(0, index + 1).join("/");
      let name = segmentNames[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      
      // Handle blog post slugs (convert kebab-case to Title Case)
      if (segments[0] === "blog" && index === 1 && segments.length > 2) {
        name = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
      
      return {
        name,
        url,
        isCurrent: index === segments.length - 1,
      };
    }),
  ];
  
  // Generate breadcrumb schema for structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://www.isaacpaha.com${item.url}`,
    })),
  };
  
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Visual Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="py-3 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto"
      >
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <li key={item.url} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-white/25 mx-0.5" />
              )}
              {item.isCurrent ? (
                <span
                  className="text-white/40 font-medium"
                  aria-current="page"
                >
                  {index === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="text-white/60 hover:text-amber-400 transition-colors duration-200"
                >
                  {index === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}