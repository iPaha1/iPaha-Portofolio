
// app/manifest.ts - Enhanced Web App Manifest
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Isaac Paha - Full-Stack Developer & Tech Entrepreneur',
    short_name: 'Isaac Paha',
    description: 'UK-based Computing & IT graduate from Open University London and full-stack developer. Founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Building scalable platforms serving 100K+ users.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f59e0b',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en-GB',
    
    icons: [
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
    
    categories: [
      'technology',
      'development',
      'portfolio',
      'business',
      'education',
      'productivity'
    ],
    
    shortcuts: [
      {
        name: 'About Isaac',
        short_name: 'About',
        description: 'Learn about Isaac Paha\'s journey',
        url: '/about',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Projects',
        short_name: 'Projects',
        description: 'View Isaac\'s portfolio',
        url: '/projects',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Blog',
        short_name: 'Blog',
        description: 'Read tech articles and insights',
        url: '/blog',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Contact',
        short_name: 'Contact',
        description: 'Get in touch for projects',
        url: '/contact',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      }
    ],

    screenshots: [
      {
        src: '/images/screenshots/desktop-home.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Portfolio Homepage'
      },
      {
        src: '/images/screenshots/mobile-home.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Portfolio Mobile View'
      }
    ]
  }
}