
// lib/page-seo.ts - Enhanced helper for page-specific SEO
import { Metadata } from 'next'
import { seoConfig } from './seo-config'

interface PageSEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  path?: string
  noIndex?: boolean
  article?: {
    publishedTime?: string
    modifiedTime?: string
    author?: string
    tags?: string[]
  }
}

export function generatePageSEO({
  title,
  description = seoConfig.defaultDescription,
  keywords = seoConfig.keywords.home,
  image = seoConfig.images.ogImage,
  path = '',
  noIndex = false,
  article
}: PageSEOProps): Metadata {
  const url = `${seoConfig.siteUrl}${path}`
  const fullTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle

  const baseMetadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: seoConfig.author, url: seoConfig.siteUrl }],
    creator: seoConfig.author,
    publisher: seoConfig.author,
    
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: seoConfig.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle
        }
      ],
      locale: 'en_GB',
      type: article ? 'article' : 'website',
      ...(article && {
        publishedTime: article.publishedTime,
        modifiedTime: article.modifiedTime,
        authors: [article.author || seoConfig.author],
        tags: article.tags
      })
    },
    
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: seoConfig.social.twitter,
      site: seoConfig.social.twitter
    },
    
    robots: noIndex ? {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false
      }
    } : {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    },
    
    alternates: {
      canonical: url,
    },

    category: 'technology',
    classification: seoConfig.business.industry,
    
    other: {
      'application-name': seoConfig.siteName,
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': seoConfig.siteName,
      'format-detection': 'telephone=no',
    }
  }

  return baseMetadata
}