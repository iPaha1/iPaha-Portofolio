// app/sitemap.ts - Generate dynamic sitemap with blog posts
import { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/blog-posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.isaacpaha.com'
  
  // Static pages with priorities and change frequencies
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const, lastModified: undefined },
    { path: '/about', priority: 0.9, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/projects', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: undefined },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/blog', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: undefined },
  ]

  // Dynamic project pages
  const projectPages = [
    { path: '/projects/okadwuma', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/projects/okddwa', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/projects/ipaha-business-suite', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/projects/storeflow-pro', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/projects/devcollab-hub', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/projects/fintrack-analytics', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
  ]

  // Get blog posts dynamically
  const blogPosts = getBlogPosts()
  const blogPages = blogPosts.map(post => ({
    path: `/blog/${post.slug}`,
    priority: post.featured ? 0.8 : 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(post.updatedAt || post.publishedAt)
  }))

  // Company pages
  const companyPages = [
    { path: '/companies/ipaha-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/companies/ipahastores-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
    { path: '/companies/okpah-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
  ]

  const allPages = [...staticPages, ...projectPages, ...blogPages, ...companyPages]

  return allPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: page.lastModified || new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}