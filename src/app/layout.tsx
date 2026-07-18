import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const manrope = Manrope({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Orla',
  description: 'The calm system that keeps your business in order.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={manrope.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
