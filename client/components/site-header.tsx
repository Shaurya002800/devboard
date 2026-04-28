import Link from 'next/link'
import { AuthStatus } from '@/components/auth-status'

const navLinks = [
  { href: '/', label: 'Browse' },
  { href: '/projects/new', label: 'Post project' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(12,10,9,0.76)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(251,146,60,0.22)] bg-[linear-gradient(180deg,var(--brand-dark),var(--brand))] text-lg font-semibold text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)]">
            DB
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">DevBoard</p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Obsidian talent network
            </p>
          </div>
        </Link>

        <nav className="glass-strip hidden items-center gap-1 rounded-full p-1.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <AuthStatus />
      </div>
    </header>
  )
}
