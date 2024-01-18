import type { Metadata } from 'next'
import { Cookie, Urbanist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
// import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import ToastifyProvider from '@/components/providers/react-taostify'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import CookiesConsent from '@/components/providers/cookies-consent'
import { Navbar1 } from '@/components/navbar1'
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/navbar'

const font = Urbanist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Isaac Paha',
  description: 'Isaac Paha\'s personal website',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={font.className}>
        <CookiesConsent />
        <ConfettiProvider />
        <ToastifyProvider />
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* <Navbar1 /> */}
        <Navbar />
        
        {children}
        
        <Footer />
        </ThemeProvider>
        </body>
    </html>
    </ClerkProvider>
  )
}
