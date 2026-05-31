import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Slick',
  description: 'Simple online booking for your business.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
