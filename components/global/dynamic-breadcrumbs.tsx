// components/ui/dynamic-breadcrumb.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  url: string;
  isCurrent?: boolean;
}

interface DynamicBreadcrumbProps {
  customSegments?: BreadcrumbItem[];
}

export function DynamicBreadcrumb({ customSegments = [] }: DynamicBreadcrumbProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  let breadcrumbs: BreadcrumbItem[] = [{ name: "Home", url: "/", isCurrent: false }];
  
  // Handle search/filter parameters
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  
  if (pathname === "/apps" && category) {
    breadcrumbs.push(
      { name: "Apps", url: "/apps" },
      { name: `Category: ${category}`, url: `${pathname}?category=${category}`, isCurrent: true }
    );
  } else if (pathname === "/blog" && tag) {
    breadcrumbs.push(
      { name: "Blog", url: "/blog" },
      { name: `Tag: ${tag}`, url: `${pathname}?tag=${tag}`, isCurrent: true }
    );
  } else if (customSegments.length > 0) {
    breadcrumbs = [...breadcrumbs, ...customSegments];
  } else {
    const segments = pathname.split("/").filter(Boolean);
    breadcrumbs.push(
      ...segments.map((segment, index) => {
        const url = "/" + segments.slice(0, index + 1).join("/");
        let name = segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        
        // Special handling
        if (segment === "ideas") name = "Ideas Lab";
        if (segment === "ask-isaac") name = "Ask Isaac";
        
        return { name, url, isCurrent: index === segments.length - 1 };
      })
    );
  }
  
  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {breadcrumbs.map((item, index) => (
          <li key={item.url} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/25" />}
            {item.isCurrent ? (
              <span className="text-amber-400 font-medium" aria-current="page">
                {index === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                {item.name}
              </span>
            ) : (
              <Link href={item.url} className="text-white/60 hover:text-amber-400 transition-colors">
                {index === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}