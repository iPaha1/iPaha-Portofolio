
// app/manifest.ts - Enhanced Web App Manifest
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Isaac Paha - Technologist, Entrepreneur, Thinker',
    short_name: 'Isaac Paha',
    description: 'Isaac Paha - exploring AI, software, and the future of society.',
    start_url: '/games',
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
        name: 'Blog',
        short_name: 'Blog',
        description: 'Read tech articles and insights',
        url: '/blog',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Apps',
        short_name: 'Apps',
        description: 'View Isaac\'s apps',
        url: '/apps',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Ideas Lab',
        short_name: 'Ideas',
        description: 'Ideas worth reading',
        url: '/ideas',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Tools',
        short_name: 'Tools',
        description: 'Tools that gets the work done',
        url: '/tools',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Games Center',
        short_name: 'Games',
        description: 'Mini games to keep you busy',
        url: '/games',
        icons: [{ src: '/favicon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Now',
        short_name: 'Now',
        description: "What I'm doing now",
        url: '/now',
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
        src: '/screenshots/desktop-home.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Homepage'
      },
      {
        src: '/screenshots/mobile-home.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Mobile View'
      },
      {
        src: '/screenshots/desktop-blog.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Blog View'
      },
      {
        src: '/screenshots/mobile-blog.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Blog View'
      },
      {
        src: '/screenshots/desktop-apps.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Apps'
      },
      {
        src: '/screenshots/mobile-apps.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Apps'
      },
      {
        src: '/screenshots/desktop-ideas-lab.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Ideas Lab'
      },
      {
        src: '/screenshots/mobile-ideas-lab.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Ideas Lab'
      },
      {
        src: '/screenshots/desktop-tools.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Tools View'
      },
      {
        src: '/screenshots/mobile-tools.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Tools View'
      },
      {
        src: '/screenshots/desktop-games.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Games'
      },
      {
        src: '/screenshots/mobile-games.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Games'
      },
      {
        src: '/screenshots/desktop-now.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Isaac Paha Now'
      },
      {
        src: '/screenshots/mobile-now.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Isaac Paha Now'
      }
    ],
    "launch_handler": {
    "client_mode": "navigate-existing"
  },
  
  }
}