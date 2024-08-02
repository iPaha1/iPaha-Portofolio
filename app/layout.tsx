import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import Footer from '@/components/footer'
import ToastifyProvider from '@/components/providers/react-taostify'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/navbar'
import Script from 'next/script'

const font = Urbanist({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.isaacpaha.com'), // Replace with your actual domain
  title: {
    default: 'Isaac Paha | Full-Stack Developer',
    template: '%s | Isaac Paha'
  },
  description: 'Isaac Paha is a full-stack developer specializing in Python, React, Node.js, and modern web technologies. Explore my portfolio and projects.',
  keywords: ['Isaac Paha', 'Full-Stack Developer', 'Python', 'React', 'Node.js', 'Web Development', 'Portfolio'],
  authors: [{ name: 'Isaac Paha' }],
  creator: 'Isaac Paha',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.isaacpaha.com',
    siteName: 'Isaac Paha',
    title: 'Isaac Paha | Full-Stack Developer',
    description: 'Explore the portfolio and projects of Isaac Paha, a full-stack developer specializing in modern web technologies.',
    images: [
      {
        url: '/images/profilePic.jpeg', 
        width: 1200,
        height: 630,
        alt: 'Isaac Paha - Full-Stack Developer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@iPaha3', 
    creator: '@isaacpaha'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <Script id="schema-script" type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "Person",
                "name": "Isaac Paha",
                "url": "https://www.isaacpaha.com",
                "sameAs": [
                  "https://github.com/iPaha1",
                  "https://www.linkedin.com/in/isaac-paha-578911a9/"
                ],
                "jobTitle": "Full-Stack Developer",
                "worksFor": {
                  "@type": "Organization",
                  "name": "Freelance"
                },
                "description": "Full-stack developer specializing in Python, React, Next js, Node.js, and modern web technologies."
              }
            `}
          </Script>
        </head>
        <body className={font.className}>
          <ConfettiProvider />
          <ToastifyProvider />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header>
              <Navbar />
            </header>
            <main>{children}</main>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}



// import type { Metadata } from 'next'
// import { Cookie, Urbanist } from 'next/font/google'
// import './globals.css'
// import { ThemeProvider } from '@/components/providers/theme-provider'
// // import { Navbar } from '@/components/navbar'
// import Footer from '@/components/footer'
// import ToastifyProvider from '@/components/providers/react-taostify'
// import { ConfettiProvider } from '@/components/providers/confetti-provider'
// // import CookiesConsent from '@/components/providers/cookies-consent'
// // import { Navbar1 } from '@/components/navbar1'
// import { ClerkProvider } from '@clerk/nextjs'
// import Navbar from '@/components/navbar'

// const font = Urbanist({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Isaac Paha',
//   description: 'Isaac Paha\'s personal website',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <ClerkProvider>
//     <html lang="en">
//       <body className={font.className}>
//         {/* <CookiesConsent /> */}
//         <ConfettiProvider />
//         <ToastifyProvider />
//         <ThemeProvider
//             attribute="class"
//             defaultTheme="system"
//             enableSystem
//             disableTransitionOnChange
//           >
//             {/* <Navbar1 /> */}
//         <Navbar />
        
//         {children}
        
//         <Footer />
//         </ThemeProvider>
//         </body>
//     </html>
//     </ClerkProvider>
//   )
// }
