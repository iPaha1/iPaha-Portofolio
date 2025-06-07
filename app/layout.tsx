import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import Navbar from '@/components/_home/navbar'
import Footer from '@/components/_home/footer'
import { WhatsAppFloatingButton } from '@/components/global/whatsapp-floating-button'

const font = Urbanist({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.isaacpaha.com'),
  title: {
    default: 'Isaac Paha | Full-Stack Developer & Tech Entrepreneur | Computing & IT Graduate',
    template: '%s | Isaac Paha - Full-Stack Developer'
  },
  description: 'Isaac Paha is a UK-based Computing & IT graduate and full-stack developer, founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Specializing in React.js, Next.js, Node.js, and digital solutions across Africa and beyond.',
  keywords: [
    'Isaac Paha',
    'Full-Stack Developer',
    'Computing IT Graduate',
    'Tech Entrepreneur',
    'iPaha Ltd',
    'iPahaStores Ltd', 
    'Okpah Ltd',
    'React.js',
    'Next.js',
    'Node.js',
    'TypeScript',
    'Tailwind CSS',
    'Web Development',
    'Software Development',
    'IT Consultancy',
    'SaaS Solutions',
    'E-commerce Development',
    'oKadwuma',
    'okDdwa',
    'UK Developer',
    'Ghana Tech',
    'Open University London',
    'Digital Solutions',
    'Custom Software',
    'Prisma ORM',
    'MySQL',
    'Express.js',
    'Stripe Integration',
    'Clerk Authentication'
  ],
  authors: [{ name: 'Isaac Paha', url: 'https://www.isaacpaha.com' }],
  creator: 'Isaac Paha',
  publisher: 'Isaac Paha',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://www.isaacpaha.com',
    siteName: 'Isaac Paha - Full-Stack Developer & Tech Entrepreneur',
    title: 'Isaac Paha | Full-Stack Developer & Tech Entrepreneur',
    description: 'UK-based Computing & IT graduate and full-stack developer. Founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Building innovative digital solutions with React.js, Next.js, and Node.js.',
    images: [
      {
        url: '/images/isaac-paha-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Isaac Paha - Full-Stack Developer & Tech Entrepreneur',
        type: 'image/jpeg'
      },
      {
        url: '/images/photo1.png',
        width: 400,
        height: 400,
        alt: 'Isaac Paha Profile Picture',
        type: 'image/png'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@iPaha3',
    creator: '@iPaha3',
    title: 'Isaac Paha | Full-Stack Developer & Tech Entrepreneur',
    description: 'Full-stack developer. Founder of three tech companies building innovative digital solutions.',
    images: ['/images/isaac-paha-og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
  },
  alternates: {
    canonical: 'https://www.isaacpaha.com',
  },
  category: 'technology',
  classification: 'Software Development, Web Development, Technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" className="scroll-smooth">
      <head>
        {/* Enhanced Schema.org Structured Data */}
        <Script id="person-schema" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Isaac Paha",
              "url": "https://www.isaacpaha.com",
              "image": "https://www.isaacpaha.com/images/photo1.png",
              "sameAs": [
                "https://github.com/iPaha1",
                "https://www.linkedin.com/in/isaac-paha-578911a9/",
                "https://ipahait.com",
                "https://ipahastore.com",
                "https://okpah.com"
              ],
              "jobTitle": "Full-Stack Developer & Tech Entrepreneur",
              "description": "UK-based Computing & IT graduate and full-stack developer, founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd",
              "alumniOf": {
                "@type": "Organization",
                "name": "Open University London"
              },
              "nationality": "British",
              "knowsAbout": [
                "React.js",
                "Next.js", 
                "Node.js",
                "TypeScript",
                "Full-Stack Development",
                "Software Development",
                "Web Development",
                "SaaS Solutions",
                "E-commerce Development"
              ],
              "founder": [
                {
                  "@type": "Organization",
                  "name": "iPaha Ltd",
                  "url": "https://ipahait.com",
                  "description": "IT consultancy providing custom software and digital solutions"
                },
                {
                  "@type": "Organization", 
                  "name": "iPahaStores Ltd",
                  "url": "https://ipahastore.com",
                  "description": "Tech company offering SaaS and e-commerce solutions"
                },
                {
                  "@type": "Organization",
                  "name": "Okpah Ltd", 
                  "url": "https://okpah.com",
                  "description": "Ghanaian innovation-driven startup building local digital platforms"
                }
              ]
            }
          `}
        </Script>

        {/* Organization Schema for Companies */}
        <Script id="organization-schema" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "iPaha Ltd",
              "url": "https://ipahait.com",
              "founder": {
                "@type": "Person",
                "name": "Isaac Paha",
                "url": "https://www.isaacpaha.com"
              },
              "description": "IT consultancy providing custom software and digital solutions",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "GB"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "pahaisaac@gmail.com",
                "contactType": "founder"
              }
            }
          `}
        </Script>

        {/* Website Schema */}
        <Script id="website-schema" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Isaac Paha - Full-Stack Developer",
              "url": "https://www.isaacpaha.com",
              "description": "Portfolio and business website of Isaac Paha, full-stack developer and tech entrepreneur",
              "author": {
                "@type": "Person",
                "name": "Isaac Paha"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.isaacpaha.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            }
          `}
        </Script>

        {/* Service Schema */}
        <Script id="service-schema" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Full-Stack Development Services",
              "description": "Professional full-stack development services including React.js, Next.js, Node.js, and custom software solutions",
              "provider": {
                "@type": "Person",
                "name": "Isaac Paha",
                "url": "https://www.isaacpaha.com"
              },
              "serviceType": [
                "Web Development",
                "Software Development", 
                "Full-Stack Development",
                "SaaS Development",
                "E-commerce Development",
                "IT Consultancy"
              ],
              "areaServed": ["United Kingdom", "Ghana", "Global"],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Development Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Custom Web Development"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "SaaS Development"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "E-commerce Solutions"
                    }
                  }
                ]
              }
            }
          `}
        </Script>

        {/* Breadcrumb Schema */}
        <Script id="breadcrumb-schema" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://www.isaacpaha.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "About",
                  "item": "https://www.isaacpaha.com/about"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Projects",
                  "item": "https://www.isaacpaha.com/projects"
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "name": "Contact",
                  "item": "https://www.isaacpaha.com/contact"
                }
              ]
            }
          `}
        </Script>

        {/* Additional Meta Tags for SEO */}
        <meta name="theme-color" content="#f59e0b" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Geo Tags */}
        <meta name="geo.region" content="GB" />
        <meta name="geo.placename" content="United Kingdom" />
        <meta name="geo.position" content="51.5074;-0.1278" />
        <meta name="ICBM" content="51.5074, -0.1278" />
        
        {/* Additional Open Graph Tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:site_name" content="Isaac Paha" />
        
        {/* Additional Twitter Tags */}
        <meta name="twitter:domain" content="isaacpaha.com" />
        <meta name="twitter:url" content="https://www.isaacpaha.com" />
        
        {/* LinkedIn Tags */}
        <meta property="linkedin:owner" content="isaac-paha-578911a9" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://github.com" />
        <link rel="preconnect" href="https://linkedin.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//github.com" />
        <link rel="dns-prefetch" href="//linkedin.com" />
        <link rel="dns-prefetch" href="//ipahait.com" />
        <link rel="dns-prefetch" href="//ipahastore.com" />
        <link rel="dns-prefetch" href="//okpah.com" />
      </head>
      <body className={font.className}>
        
          <header>
            <Navbar />
          </header>
          <main id="main-content" role="main">
            <WhatsAppFloatingButton />
            {children}
          </main>
          <Footer />

        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>

        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
          `}
        </Script>

        {/* Hotjar */}
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      </body>
    </html>
  )
}




// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "Create Next App",
//   description: "Generated by create next app",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//         {children}
//       </body>
//     </html>
//   );
// }
