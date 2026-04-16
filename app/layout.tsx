import './globals.css'
import { Metadata } from 'next'
import GlobalSettingsProvider from '@/contexts/GlobalSettingsContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'termstack | AI-powered app builder',
  description: 'Connect a supported coding CLI, build in a live Next.js workspace, and ship with preview-first feedback.',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
        <GlobalSettingsProvider>
          <div className="relative min-h-screen">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(89,214,163,0.1),_transparent_32%)]" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                  maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.85), transparent 92%)',
                }}
              />
            </div>
            <main className="relative z-10 min-h-screen">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </GlobalSettingsProvider>
      </body>
    </html>
  )
}
