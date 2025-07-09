import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '東翔運輸株式会社 ドライバー管理システム',
  description: 'ドライバー休暇管理・車両整備管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} h-full antialiased bg-gradient-to-br from-blue-50 to-indigo-100`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 