import type { Metadata } from 'next'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { ToastProvider } from '@/components/toast-provider'

export const metadata: Metadata = {
  title: 'DevBoard',
  description: 'A marketplace for developers to post projects and collaborate.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full bg-[var(--bg)] text-[var(--ink)] antialiased">
        <ToastProvider>
          <div className="min-h-screen">
            <SiteHeader />
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="border-t border-[var(--line)] bg-[#e9decc] px-4 py-8 text-sm text-[var(--muted)] sm:px-6">
              <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
                <span className="font-[Georgia] text-lg text-[var(--brand-dark)]">
                  DevBoard
                </span>
                <span>Thoughtful projects. Good people. Better work.</span>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
