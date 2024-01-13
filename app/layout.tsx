import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import ToastifyProvider from '@/components/providers/react-taostify'
import { ConfettiProvider } from '@/components/providers/confetti-provider'

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
    <html lang="en">
      <body className={font.className}>
        <ConfettiProvider />
        <ToastifyProvider />
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <Navbar />
        {children}
        <Footer />
        </ThemeProvider>
        </body>
    </html>
  )
}
