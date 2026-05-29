import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BookMoto',
  description: 'Booking platform for motorcycle training schools.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
