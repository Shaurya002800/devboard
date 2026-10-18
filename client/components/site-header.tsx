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
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(250,246,238,0.94)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#51331f] bg-[var(--brand)] text-lg font-semibold text-[#fff9ef]">
            DB
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">DevBoard</p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              The independent work board
            </p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center justify-around gap-1 border-t border-[var(--line)] pt-3 md:order-none md:w-auto md:justify-start md:rounded-md md:border md:bg-[#f4ebdc] md:p-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)] sm:px-4 sm:text-sm"
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
