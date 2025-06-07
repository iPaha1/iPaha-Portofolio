
// app/robots.ts - Enhanced SEO robots configuration
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/private/',
          '/admin/',
          '/_next/',
          '/api/',
          '/temp/',
          '/*.json$',
          '/404',
          '/500'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/private/', '/admin/', '/api/contact'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/private/', '/admin/'],
        crawlDelay: 1,
      },
      // Allow social media crawlers
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
      },
      {
        userAgent: 'LinkedInBot',
        allow: '/',
      },
    ],
    sitemap: 'https://www.isaacpaha.com/sitemap.xml',
    host: 'https://www.isaacpaha.com',
  }
}