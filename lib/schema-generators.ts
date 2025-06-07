import { seoConfig } from "./seo-config"

// lib/schema-generators.ts - Enhanced schema generators
export function generatePersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": seoConfig.personal.fullName,
    "url": seoConfig.siteUrl,
    "image": `${seoConfig.siteUrl}${seoConfig.images.profile}`,
    "jobTitle": seoConfig.personal.title,
    "description": seoConfig.defaultDescription,
    "email": seoConfig.personal.email,
    "telephone": seoConfig.personal.phone,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB"
    },
    "alumniOf": {
      "@type": "Organization",
      "name": "Open University London",
      "url": "https://www.open.ac.uk"
    },
    "sameAs": Object.values(seoConfig.social),
    "knowsAbout": [
      ...seoConfig.techStack.frontend,
      ...seoConfig.techStack.backend,
      "Entrepreneurship",
      "Startup Development",
      "Technical Leadership"
    ],
    "founder": seoConfig.companies.map(company => ({
      "@type": "Organization",
      "name": company.name,
      "url": company.url,
      "description": company.description,
      "foundingDate": company.founded,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": company.location === 'United Kingdom' ? 'GB' : 'GH'
      }
    }))
  }
}

export function generateOrganizationSchema(company: typeof seoConfig.companies[0]) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name,
    "url": company.url,
    "description": company.description,
    "foundingDate": company.founded,
    "founder": {
      "@type": "Person",
      "name": seoConfig.personal.fullName,
      "url": seoConfig.siteUrl
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": company.location === 'United Kingdom' ? 'GB' : 'GH'
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": seoConfig.personal.email,
      "telephone": seoConfig.personal.phone,
      "contactType": "founder"
    },
    "serviceArea": company.location,
    "services": company.services
  }
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": seoConfig.siteName,
    "url": seoConfig.siteUrl,
    "description": seoConfig.defaultDescription,
    "author": {
      "@type": "Person",
      "name": seoConfig.personal.fullName
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${seoConfig.siteUrl}/blog?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  }
}

export function generateArticleSchema(article: {
  title: string
  description: string
  url: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: string
  tags?: string[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "url": article.url,
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author || seoConfig.personal.fullName,
      "url": seoConfig.siteUrl
    },
    "publisher": {
      "@type": "Person",
      "name": seoConfig.personal.fullName,
      "url": seoConfig.siteUrl
    },
    ...(article.image && {
      "image": {
        "@type": "ImageObject",
        "url": article.image,
        "width": 1200,
        "height": 630
      }
    }),
    "keywords": article.tags?.join(', '),
    "articleSection": "Technology",
    "inLanguage": "en-GB"
  }
}

export function generateProductSchema(product: typeof seoConfig.products[0] & {
  image?: string
  dateCreated?: string
  technologies?: string[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": product.name,
    "description": product.description,
    "url": product.url,
    "applicationCategory": "WebApplication",
    "operatingSystem": "Web Browser",
    "author": {
      "@type": "Person",
      "name": seoConfig.personal.fullName,
      "url": seoConfig.siteUrl
    },
    "creator": {
      "@type": "Person", 
      "name": seoConfig.personal.fullName
    },
    "dateCreated": product.dateCreated || product.launched,
    "programmingLanguage": product.technologies || seoConfig.techStack.frontend,
    ...(product.image && {
      "screenshot": {
        "@type": "ImageObject",
        "url": product.image
      }
    }),
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    }
  }
}