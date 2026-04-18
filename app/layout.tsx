import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Contextree',
  description: 'Hierarchical AI context manager. Build a tree of context — every chat inherits everything above it.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}