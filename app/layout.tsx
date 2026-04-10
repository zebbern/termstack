import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio | Dark Theme',
  description: 'A beautiful dark theme portfolio showcasing projects and skills',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className="bg-slate-950 text-slate-50 min-h-screen">
        <div className="relative">
          {/* Animated background gradient */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>
          <main className="relative z-10">{children}</main>
        </div>
      </body>
    </html>
  )
}
