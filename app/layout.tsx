import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProForma AI — Institutional Real Estate Analysis',
  description:
    'Institutional-grade real estate pro forma powered by AI. Upload any Crexi memo or enter data manually.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
